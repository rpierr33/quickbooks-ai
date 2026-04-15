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
        'SELECT * FROM recurring_transactions WHERE company_id = $1 ORDER BY next_run ASC',
        [companyId]
      );
      rows = result.rows;
    } else {
      const all = await listFromStore('recurring_transactions');
      rows = all.filter(r => r.company_id === companyId);
      rows.sort((a, b) => String(a.next_run).localeCompare(String(b.next_run)));
    }

    rows = rows.map(r => ({
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
    const { unauthorized: unauth, session } = await requireAuth();
    if (unauth) return unauth;
    const companyId = (session?.user as any)?.companyId;
    const body = await request.json();
    const { description, amount, type, account_id, category_id, frequency, next_run } = body;

    if (!description || !amount || !type || !frequency || !next_run) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRecurring = {
      id: crypto.randomUUID(),
      company_id: companyId,
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

    await addToStore('recurring_transactions', newRecurring);
    return NextResponse.json(newRecurring, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}
