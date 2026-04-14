import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const result = await query('SELECT * FROM recurring_transactions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }
    return NextResponse.json({ ...result.rows[0], amount: parseFloat(result.rows[0].amount) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recurring transaction' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized: unauth } = await requireAuth();
    if (unauth) return unauth;
    const { id } = await params;
    const body = await request.json();

    const result = await query('SELECT * FROM recurring_transactions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }

    const allowed = pickAllowed(body, RECURRING_WRITE_FIELDS);
    const updated = { ...result.rows[0], ...allowed, amount: parseFloat((allowed.amount as string | number | undefined) ?? result.rows[0].amount) };
    await updateInStore('recurring_transactions', id, allowed);

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recurring transaction' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized: unauth2 } = await requireAuth();
    if (unauth2) return unauth2;
    const { id } = await params;
    const result = await query('DELETE FROM recurring_transactions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete recurring transaction' }, { status: 500 });
  }
}
