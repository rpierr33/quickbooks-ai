import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const result = await query('SELECT * FROM budgets ORDER BY created_at DESC');

    const rows = result.rows.map(r => ({
      ...r,
      monthly_amount: parseFloat(r.monthly_amount),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Budgets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized: unauth } = await requireAuth();
    if (unauth) return unauth;
    const body = await request.json();
    const { category_id, category_name, monthly_amount, period } = body;

    if (!category_id || !category_name || monthly_amount === undefined || !period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newBudget = {
      id: crypto.randomUUID(),
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
