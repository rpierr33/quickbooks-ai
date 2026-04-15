import { NextRequest, NextResponse } from 'next/server';
import { requireWrite, requireDelete } from '@/lib/auth-guard';
import { listFromStore, updateInStore, deleteFromStore } from '@/lib/db';
import { asRecord, getString, getNumber, getEnum, pickAllowed, ValidationError } from '@/lib/validate';

const EMP_WRITE_FIELDS = [
  'name', 'email', 'role', 'pay_type', 'rate',
  'tax_withholding_pct', 'status', 'start_date',
] as const;
const PAY_TYPES = ['salary', 'hourly'] as const;
const EMP_STATUSES = ['active', 'inactive'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;

    const employees = await listFromStore('employees');
    const existing = employees.find(e => e.id === id && e.company_id === companyId);
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, EMP_WRITE_FIELDS);
    const patch: Record<string, unknown> = {};

    if ('name' in allowed) patch.name = getString(body, 'name', { required: true, max: 200 });
    if ('email' in allowed) patch.email = getString(body, 'email', { max: 255 });
    if ('role' in allowed) patch.role = getString(body, 'role', { max: 200 });
    if ('pay_type' in allowed) patch.pay_type = getEnum(body, 'pay_type', PAY_TYPES, { required: true });
    if ('rate' in allowed) patch.rate = getNumber(body, 'rate', { required: true, min: 0 });
    if ('tax_withholding_pct' in allowed) patch.tax_withholding_pct = getNumber(body, 'tax_withholding_pct', { min: 0, max: 100 });
    if ('status' in allowed) patch.status = getEnum(body, 'status', EMP_STATUSES);
    if ('start_date' in allowed) patch.start_date = getString(body, 'start_date', { max: 20 });

    const updated = await updateInStore('employees', id, { ...patch, updated_at: new Date().toISOString() });
    return NextResponse.json(updated ?? { ...existing, ...patch });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('payroll[id].PUT error:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireDelete();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;

    const employees = await listFromStore('employees');
    const existing = employees.find(e => e.id === id && e.company_id === companyId);
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const deleted = await deleteFromStore('employees', id);
    if (!deleted) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('payroll[id].DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
