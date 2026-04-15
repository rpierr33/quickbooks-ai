import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore, listFromStore, pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    let rows: Record<string, any>[];
    if (pool) {
      const result = await query(
        'SELECT * FROM budgets WHERE company_id = $1 ORDER BY created_at DESC',
        [companyId]
      );
      rows = result.rows;
    } else {
      const all = await listFromStore('budgets');
      rows = all.filter(r => r.company_id === companyId);
    }

    const parsed = rows.map(r => ({
      ...r,
      monthly_amount: parseFloat(r.monthly_amount),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Budgets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized: unauth, session } = await requireAuth();
    if (unauth) return unauth;
    const companyId = (session?.user as any)?.companyId;
    const body = await request.json();
    const { category_id, category_name, monthly_amount, period } = body;

    if (!category_id || !category_name || monthly_amount === undefined || !period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newBudget = {
      id: crypto.randomUUID(),
      company_id: companyId,
      category_id,
      category_name,
      monthly_amount: parseFloat(monthly_amount),
      period,
      created_at: new Date().toISOString(),
    };

    await addToStore('budgets', newBudget);
    return NextResponse.json(newBudget, { status: 201 });
  } catch (error) {
    console.error('Budgets POST error:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}
