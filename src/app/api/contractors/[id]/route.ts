import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { listFromStore, updateInStore, deleteFromStore } from '@/lib/db';
import { asRecord, getString, getNumber, getEnum, getArray, pickAllowed, ValidationError } from '@/lib/validate';

const CONTRACTOR_WRITE_FIELDS = [
  'name', 'email', 'address', 'tax_id_last4', 'tax_id_type',
  'payment_terms', 'rate', 'rate_type', 'total_paid_ytd', 'is_active', 'notes',
] as const;
const TAX_ID_TYPES = ['SSN', 'EIN'] as const;
const RATE_TYPES = ['hourly', 'project'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const contractors = listFromStore('contractors');
    const existing = contractors.find(c => c.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, CONTRACTOR_WRITE_FIELDS);
    const patch: Record<string, unknown> = {};

    if ('name' in allowed) patch.name = getString(body, 'name', { required: true, max: 200 });
    if ('email' in allowed) patch.email = getString(body, 'email', { max: 255 });
    if ('address' in allowed) patch.address = getString(body, 'address', { max: 500 });
    if ('tax_id_last4' in allowed) patch.tax_id_last4 = getString(body, 'tax_id_last4', { max: 4 });
    if ('tax_id_type' in allowed) patch.tax_id_type = getEnum(body, 'tax_id_type', TAX_ID_TYPES);
    if ('payment_terms' in allowed) patch.payment_terms = getString(body, 'payment_terms', { max: 50 });
    if ('rate' in allowed) patch.rate = getNumber(body, 'rate', { min: 0 });
    if ('rate_type' in allowed) patch.rate_type = getEnum(body, 'rate_type', RATE_TYPES);
    if ('total_paid_ytd' in allowed) patch.total_paid_ytd = getNumber(body, 'total_paid_ytd', { min: 0 });
    if ('is_active' in allowed) patch.is_active = Boolean(body.is_active);
    if ('notes' in allowed) patch.notes = getString(body, 'notes', { max: 2000 });

    const updated = updateInStore('contractors', id, { ...patch, updated_at: new Date().toISOString() });
    return NextResponse.json(updated ?? { ...existing, ...patch });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('contractors[id].PUT error:', error);
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const deleted = deleteFromStore('contractors', id);
    if (!deleted) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('contractors[id].DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
