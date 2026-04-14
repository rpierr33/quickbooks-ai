import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore } from '@/lib/db';
import { requireAuth, requireWrite, requireDelete } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getEnum,
  getNumber,
  pickAllowed,
  ValidationError,
} from '@/lib/validate';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;

// Mass-assignment allowlist — see CLAUDE.md §Hard rules
const ACCOUNT_WRITE_FIELDS = [
  'name',
  'type',
  'sub_type',
  'balance',
  'is_active',
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const result = await query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    const row = result.rows[0];
    return NextResponse.json({ ...row, balance: parseFloat(row.balance) });
  } catch (error) {
    console.error('accounts[id].GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireWrite();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, ACCOUNT_WRITE_FIELDS);

    const patch: Record<string, unknown> = {};
    if ('name' in allowed) patch.name = getString(body, 'name', { required: true, max: 100 });
    if ('type' in allowed) patch.type = getEnum(body, 'type', ACCOUNT_TYPES, { required: true });
    if ('sub_type' in allowed) patch.sub_type = getString(body, 'sub_type', { max: 50 });
    if ('balance' in allowed) patch.balance = getNumber(body, 'balance');
    if ('is_active' in allowed) patch.is_active = body.is_active;

    const result = await query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const updates = { ...patch, updated_at: new Date().toISOString() };
    updateInStore('accounts', id, updates);
    const updated = { ...result.rows[0], ...updates };
    return NextResponse.json({ ...updated, balance: parseFloat(updated.balance as string) });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('accounts[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireDelete();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    await query('DELETE FROM accounts WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('accounts[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
