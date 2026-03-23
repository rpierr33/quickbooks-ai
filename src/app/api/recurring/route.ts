import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM recurring_transactions ORDER BY next_run ASC');
    const rows = result.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
    }));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, amount, type, account_id, category_id, frequency, next_run } = body;

    if (!description || !amount || !type || !frequency || !next_run) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRecurring = {
      id: crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      type,
      account_id: account_id || null,
      category_id: category_id || null,
      frequency,
      next_run,
      last_run: null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(newRecurring, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}
