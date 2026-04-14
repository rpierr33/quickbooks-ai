import { NextRequest, NextResponse } from 'next/server';
import { listFromStore, updateInStore, deleteFromStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getNumber,
  pickAllowed,
  ValidationError,
} from '@/lib/validate';

const TIME_WRITE_FIELDS = [
  'date',
  'client_name',
  'project_name',
  'description',
  'hours',
  'minutes',
  'is_billable',
  'hourly_rate',
  'notes',
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const rows = await listFromStore('time_entries');
    const existing = rows.find(r => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, TIME_WRITE_FIELDS);

    const patch: Record<string, unknown> = {};
    if ('date' in allowed) patch.date = getString(body, 'date', { required: true, max: 40 });
    if ('client_name' in allowed) patch.client_name = getString(body, 'client_name', { required: true, max: 200 });
    if ('project_name' in allowed) patch.project_name = getString(body, 'project_name', { required: true, max: 200 });
    if ('description' in allowed) patch.description = getString(body, 'description', { required: true, max: 1000 });
    if ('hours' in allowed) patch.hours = getNumber(body, 'hours', { required: true, min: 0 });
    if ('minutes' in allowed) patch.minutes = getNumber(body, 'minutes', { required: true, min: 0, max: 59 });
    if ('is_billable' in allowed) patch.is_billable = body.is_billable === true;
    if ('hourly_rate' in allowed) patch.hourly_rate = getNumber(body, 'hourly_rate', { min: 0 });
    if ('notes' in allowed) patch.notes = getString(body, 'notes', { max: 2000 });

    // Recalculate total
    const finalHours = (patch.hours as number) ?? Number(existing.hours);
    const finalMinutes = (patch.minutes as number) ?? Number(existing.minutes);
    const finalBillable = ('is_billable' in patch) ? patch.is_billable : existing.is_billable;
    const finalRate = (patch.hourly_rate as number) ?? parseFloat(existing.hourly_rate ?? 0);
    const totalHrs = finalHours + finalMinutes / 60;
    patch.total_amount = finalBillable ? parseFloat((totalHrs * finalRate).toFixed(2)) : 0;
    patch.updated_at = new Date().toISOString();

    const updated = await updateInStore('time_entries', id, patch);
    return NextResponse.json(updated ?? { ...existing, ...patch });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('time-entries[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 });
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

    const rows = await listFromStore('time_entries');
    const existing = rows.find(r => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    await deleteFromStore('time_entries', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('time-entries[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 });
  }
}
