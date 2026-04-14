import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore } from '@/lib/db';
import { requireWrite, requireDelete } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getNumber,
  getEnum,
  pickAllowed,
  ValidationError,
} from '@/lib/validate';

// Allowlist. Anything not in this list is silently dropped (mass-assignment
// defense — see CLAUDE.md §Hard rules).
const TX_WRITE_FIELDS = [
  'date',
  'description',
  'amount',
  'type',
  'account_id',
  'category_id',
  'notes',
] as const;
const TX_TYPES = ['income', 'expense', 'transfer'] as const;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized } = await requireWrite();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, TX_WRITE_FIELDS);

    const patch: Record<string, unknown> = {};
    if ('date' in allowed) patch.date = getString(body, 'date', { required: true, max: 40 });
    if ('description' in allowed) patch.description = getString(body, 'description', { required: true, max: 500 });
    if ('amount' in allowed) patch.amount = getNumber(body, 'amount', { required: true, min: 0 });
    if ('type' in allowed) patch.type = getEnum(body, 'type', TX_TYPES, { required: true });
    if ('account_id' in allowed) patch.account_id = getString(body, 'account_id', { max: 64 });
    if ('category_id' in allowed) patch.category_id = getString(body, 'category_id', { max: 64 });
    if ('notes' in allowed) patch.notes = getString(body, 'notes', { max: 2000 });

    const result = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updates = { ...patch, updated_at: new Date().toISOString() };
    await updateInStore('transactions', id, updates);
    const updated = { ...result.rows[0], ...updates };
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('transactions[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized } = await requireDelete();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    await query('DELETE FROM transactions WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('transactions[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
