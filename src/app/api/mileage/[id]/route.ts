import { NextRequest, NextResponse } from 'next/server';
import { listFromStore, updateInStore, deleteFromStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getNumber,
  getEnum,
  pickAllowed,
  ValidationError,
} from '@/lib/validate';

const MILEAGE_WRITE_FIELDS = [
  'date',
  'from_location',
  'to_location',
  'miles',
  'purpose',
  'is_round_trip',
  'notes',
] as const;
const PURPOSE_TYPES = ['business', 'personal', 'medical', 'charity'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, MILEAGE_WRITE_FIELDS);

    const rows = await listFromStore('mileage');
    const existing = rows.find(r => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Mileage record not found' }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};
    if ('date' in allowed) patch.date = getString(body, 'date', { required: true, max: 40 });
    if ('from_location' in allowed) patch.from_location = getString(body, 'from_location', { required: true, max: 500 });
    if ('to_location' in allowed) patch.to_location = getString(body, 'to_location', { required: true, max: 500 });
    if ('miles' in allowed) patch.miles = getNumber(body, 'miles', { required: true, min: 0 });
    if ('purpose' in allowed) patch.purpose = getEnum(body, 'purpose', PURPOSE_TYPES, { required: true });
    if ('is_round_trip' in allowed) patch.is_round_trip = body.is_round_trip === true;
    if ('notes' in allowed) patch.notes = getString(body, 'notes', { max: 2000 });

    // Recalculate deduction
    const rateMap: Record<string, number> = {
      business: 0.70,
      medical: 0.21,
      charity: 0.14,
      personal: 0,
    };
    const finalPurpose = (patch.purpose as string) ?? existing.purpose;
    const finalMiles = (patch.miles as number) ?? parseFloat(existing.miles);
    const finalRoundTrip = ('is_round_trip' in patch) ? patch.is_round_trip : existing.is_round_trip;
    const rate_per_mile = rateMap[finalPurpose] ?? 0.70;
    const effectiveMiles = finalRoundTrip ? finalMiles * 2 : finalMiles;
    patch.rate_per_mile = rate_per_mile;
    patch.deduction_amount = parseFloat((effectiveMiles * rate_per_mile).toFixed(2));
    patch.updated_at = new Date().toISOString();

    const updated = await updateInStore('mileage', id, patch);
    return NextResponse.json(updated ?? { ...existing, ...patch });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('mileage[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update mileage record' }, { status: 500 });
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

    const rows = await listFromStore('mileage');
    const existing = rows.find(r => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Mileage record not found' }, { status: 404 });
    }

    await deleteFromStore('mileage', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('mileage[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete mileage record' }, { status: 500 });
  }
}
