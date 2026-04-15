import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore, listFromStore, pool } from '@/lib/db';
import { requireAuth, requireWrite, requireDelete } from '@/lib/auth-guard';
import { pickAllowed } from '@/lib/validate';

const RECURRING_WRITE_FIELDS = [
  'description',
  'amount',
  'type',
  'frequency',
  'next_date',
  'category',
  'is_active',
  'notes',
] as const;

async function findRecurring(id: string, companyId: string): Promise<Record<string, any> | null> {
  if (pool) {
    const result = await query(
      'SELECT * FROM recurring_transactions WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    return result.rows[0] ?? null;
  }
  const all = await listFromStore('recurring_transactions');
  return all.find(r => r.id === id && r.company_id === companyId) ?? null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;
    const row = await findRecurring(id, companyId);
    if (!row) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }
    return NextResponse.json({ ...row, amount: parseFloat(row.amount) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recurring transaction' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized: unauth, session } = await requireWrite();
    if (unauth) return unauth;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;
    const body = await request.json();

    const existing = await findRecurring(id, companyId);
    if (!existing) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }

    const allowed = pickAllowed(body, RECURRING_WRITE_FIELDS);
    const updated = { ...existing, ...allowed, amount: parseFloat((allowed.amount as string | number | undefined) ?? existing.amount) };
    await updateInStore('recurring_transactions', id, allowed);

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recurring transaction' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized: unauth2, session } = await requireDelete();
    if (unauth2) return unauth2;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;

    const existing = await findRecurring(id, companyId);
    if (!existing) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }

    if (pool) {
      await query(
        'DELETE FROM recurring_transactions WHERE id = $1 AND company_id = $2',
        [id, companyId]
      );
    } else {
      await query('DELETE FROM recurring_transactions WHERE id = $1', [id]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete recurring transaction' }, { status: 500 });
  }
}
