import { NextRequest, NextResponse } from 'next/server';
import { addToStore, listFromStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { asRecord, getString, getNumber, ValidationError } from '@/lib/validate';

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(request.url);
    const client = searchParams.get('client');
    const project = searchParams.get('project');
    const billable = searchParams.get('billable');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let rows = listFromStore('time_entries');

    if (client && client !== 'all') {
      rows = rows.filter(r => r.client_name === client);
    }
    if (project && project !== 'all') {
      rows = rows.filter(r => r.project_name === project);
    }
    if (billable === 'true') {
      rows = rows.filter(r => r.is_billable === true);
    } else if (billable === 'false') {
      rows = rows.filter(r => r.is_billable === false);
    }
    if (dateFrom) {
      rows = rows.filter(r => r.date >= dateFrom);
    }
    if (dateTo) {
      rows = rows.filter(r => r.date <= dateTo);
    }

    rows = [...rows].sort((a, b) => b.date.localeCompare(a.date));

    rows = rows.map(r => ({
      ...r,
      hours: Number(r.hours),
      minutes: Number(r.minutes),
      hourly_rate: parseFloat(r.hourly_rate ?? 0),
      total_amount: parseFloat(r.total_amount ?? 0),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Time entries GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    const body = asRecord(await request.json());
    const date = getString(body, 'date', { required: true, max: 40 })!;
    const client_name = getString(body, 'client_name', { required: true, max: 200 })!;
    const project_name = getString(body, 'project_name', { required: true, max: 200 })!;
    const description = getString(body, 'description', { required: true, max: 1000 })!;
    const hours = getNumber(body, 'hours', { required: true, min: 0 }) ?? 0;
    const minutes = getNumber(body, 'minutes', { required: true, min: 0, max: 59 }) ?? 0;
    const is_billable = body.is_billable === true;
    const hourly_rate = getNumber(body, 'hourly_rate', { min: 0 }) ?? 0;
    const notes = getString(body, 'notes', { max: 2000 });

    const totalHours = hours + minutes / 60;
    const total_amount = is_billable ? parseFloat((totalHours * hourly_rate).toFixed(2)) : 0;

    const id = crypto.randomUUID();
    const record = {
      id,
      date,
      client_name,
      project_name,
      description,
      hours,
      minutes,
      is_billable,
      hourly_rate,
      total_amount,
      timer_start: null,
      timer_end: null,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addToStore('time_entries', record);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Time entries POST error:', error);
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
  }
}
