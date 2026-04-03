import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { categorizeTransaction } from '@/lib/ai';
import { applyRules } from '@/lib/rules-engine';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let result;
    if (type && type !== 'all') {
      result = await query('SELECT * FROM transactions WHERE type = $1 ORDER BY date DESC', [type]);
    } else {
      result = await query('SELECT * FROM transactions ORDER BY date DESC');
    }

    let rows = result.rows;

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => r.description.toLowerCase().includes(s));
    }

    // Parse amounts
    rows = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const { date, description, amount, type, account_id, category_id, notes } = body;

    if (!date || !description || amount === undefined || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let finalCategoryId = category_id;
    let aiCategorized = false;
    let aiConfidence = null;

    // Try rules engine first
    if (!finalCategoryId) {
      const ruleResult = await applyRules(description, parseFloat(amount), type);
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
      const aiResult = await categorizeTransaction(description, parseFloat(amount));
      // Find matching category by name
      const categories = await query('SELECT * FROM categories');
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
      date,
      description,
      amount: parseFloat(amount),
      type,
      account_id: account_id || null,
      category_id: finalCategoryId || null,
      is_recurring: false,
      recurring_rule_id: null,
      ai_categorized: aiCategorized,
      ai_confidence: aiConfidence,
      notes: notes || null,
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addToStore('transactions', newTransaction);
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
