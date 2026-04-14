import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore, listFromStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { asRecord, getString, getNumber, getEnum, ValidationError } from '@/lib/validate';

const PURPOSE_TYPES = ['business', 'personal', 'medical', 'charity'] as const;

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get('purpose');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Use listFromStore for mock DB (avoids SQL parsing issues with new table)
    let rows = listFromStore('mileage');

    if (purpose && purpose !== 'all') {
      rows = rows.filter(r => r.purpose === purpose);
    }
    if (dateFrom) {
      rows = rows.filter(r => r.date >= dateFrom);
    }
    if (dateTo) {
      rows = rows.filter(r => r.date <= dateTo);
    }

    rows = [...rows].sort((a, b) => b.date.localeCompare(a.date));

    // Parse numeric fields
    rows = rows.map(r => ({
      ...r,
      miles: parseFloat(r.miles),
      rate_per_mile: parseFloat(r.rate_per_mile),
      deduction_amount: parseFloat(r.deduction_amount),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Mileage GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch mileage records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    const body = asRecord(await request.json());
    const date = getString(body, 'date', { required: true, max: 40 })!;
    const from_location = getString(body, 'from_location', { required: true, max: 500 })!;
    const to_location = getString(body, 'to_location', { required: true, max: 500 })!;
    const miles = getNumber(body, 'miles', { required: true, min: 0 })!;
    const purpose = getEnum(body, 'purpose', PURPOSE_TYPES, { required: true })!;
    const is_round_trip = body.is_round_trip === true;
    const notes = getString(body, 'notes', { max: 2000 });

    // IRS standard rates for 2026
    const rateMap: Record<string, number> = {
      business: 0.70,
      medical: 0.21,
      charity: 0.14,
      personal: 0,
    };
    const rate_per_mile = rateMap[purpose] ?? 0.70;
    const effectiveMiles = is_round_trip ? miles * 2 : miles;
    const deduction_amount = parseFloat((effectiveMiles * rate_per_mile).toFixed(2));

    const id = crypto.randomUUID();
    const record = {
      id,
      date,
      from_location,
      to_location,
      miles,
      purpose,
      rate_per_mile,
      deduction_amount,
      is_round_trip,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addToStore('mileage', record);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Mileage POST error:', error);
    return NextResponse.json({ error: 'Failed to create mileage record' }, { status: 500 });
  }
}
