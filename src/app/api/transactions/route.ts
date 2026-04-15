import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { categorizeTransaction } from '@/lib/ai';
import { applyRules } from '@/lib/rules-engine';
import { requireAuth, requireWrite } from '@/lib/auth-guard';
import { asRecord, getString, getNumber, getEnum, ValidationError } from '@/lib/validate';

const TX_TYPES = ['income', 'expense', 'transfer'] as const;

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let result;
    if (type && type !== 'all') {
      result = await query(
        'SELECT * FROM transactions WHERE company_id = $1 AND type = $2 ORDER BY date DESC',
        [companyId, type]
      );
    } else {
      result = await query(
        'SELECT * FROM transactions WHERE company_id = $1 ORDER BY date DESC',
        [companyId]
      );
    }

    let rows = result.rows;

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => r.description.toLowerCase().includes(s));
    }

    // Parse amounts and currency fields
    rows = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      currency: r.currency ?? 'USD',
      exchange_rate: parseFloat(r.exchange_rate ?? 1) || 1,
      base_amount: parseFloat(r.base_amount ?? r.amount) || parseFloat(r.amount),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const body = asRecord(await request.json());
    const date = getString(body, 'date', { required: true, max: 40 })!;
    const description = getString(body, 'description', { required: true, max: 500 })!;
    const amount = getNumber(body, 'amount', { required: true, min: 0 })!;
    const type = getEnum(body, 'type', TX_TYPES, { required: true })!;
    const account_id = getString(body, 'account_id', { max: 64 });
    const category_id = getString(body, 'category_id', { max: 64 });
    const notes = getString(body, 'notes', { max: 2000 });

    const currency = getString(body, 'currency', { max: 10 }) ?? 'USD';
    const exchange_rate = getNumber(body, 'exchange_rate', { min: 0 }) ?? 1.0;
    const base_amount = getNumber(body, 'base_amount', { min: 0 }) ?? amount;

    let finalCategoryId = category_id;
    let aiCategorized = false;
    let aiConfidence = null;

    // Try rules engine first
    if (!finalCategoryId) {
      const ruleResult = await applyRules(description, amount, type);
      if (ruleResult.matched) {
        const setCategoryAction = ruleResult.actions.find(a => a.action === 'set_category');
        if (setCategoryAction) {
          finalCategoryId = setCategoryAction.value;
          aiCategorized = false;
        }
      }
    }

    // If still no category, try AI
    if (!finalCategoryId) {
      const aiResult = await categorizeTransaction(description, amount);
      // Find matching category by name scoped to company
      const categories = await query(
        'SELECT * FROM categories WHERE company_id = $1',
        [companyId]
      );
      const matchedCat = categories.rows.find(
        c => c.name.toLowerCase() === aiResult.category.toLowerCase()
      );
      if (matchedCat) {
        finalCategoryId = matchedCat.id;
        aiCategorized = true;
        aiConfidence = aiResult.confidence;
      }
    }

    const id = crypto.randomUUID();
    const newTransaction = {
      id,
      company_id: companyId,
      date,
      description,
      amount,
      type,
      account_id: account_id ?? null,
      category_id: finalCategoryId ?? null,
      is_recurring: false,
      recurring_rule_id: null,
      ai_categorized: aiCategorized,
      ai_confidence: aiConfidence,
      notes: notes ?? null,
      attachments: [],
      currency,
      exchange_rate,
      base_amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('transactions', newTransaction);
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Transactions POST error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
