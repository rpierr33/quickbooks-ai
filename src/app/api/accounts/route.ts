import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { requireAuth, requireWrite } from '@/lib/auth-guard';
import { asRecord, getString, getEnum, ValidationError } from '@/lib/validate';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const usePagination = pageParam !== null;
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50', 10)), 200);
    const offset = (page - 1) * limit;

    const { pool: dbPool } = await import('@/lib/db');

    if (dbPool && usePagination) {
      const countResult = await query(
        'SELECT COUNT(*) FROM accounts WHERE company_id = $1',
        [companyId]
      );
      const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

      const result = await query(
        'SELECT * FROM accounts WHERE company_id = $1 ORDER BY name LIMIT $2 OFFSET $3',
        [companyId, limit, offset]
      );
      const rows = result.rows.map(r => ({ ...r, balance: parseFloat(r.balance) }));

      return NextResponse.json({
        data: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    const result = await query(
      'SELECT * FROM accounts WHERE company_id = $1 ORDER BY name',
      [companyId]
    );
    const rows = result.rows.map(r => ({
      ...r,
      balance: parseFloat(r.balance),
    }));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('accounts.GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const body = asRecord(await request.json());
    const name = getString(body, 'name', { required: true, max: 100 })!;
    const type = getEnum(body, 'type', ACCOUNT_TYPES, { required: true })!;
    const sub_type = getString(body, 'sub_type', { max: 50 });

    const newAccount = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name,
      type,
      sub_type: sub_type ?? null,
      balance: 0,
      currency: 'USD',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('accounts', newAccount);
    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('accounts.POST failed', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
