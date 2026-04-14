import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { pickAllowed } from '@/lib/validate';

const ESTIMATE_WRITE_FIELDS = [
  'client_name',
  'client_email',
  'items',
  'notes',
  'status',
  'valid_until',
  'tax_rate',
  'discount',
] as const;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const result = await query('SELECT * FROM estimates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }
    const est = result.rows[0];
    return NextResponse.json({
      ...est,
      subtotal: parseFloat(est.subtotal),
      tax_rate: parseFloat(est.tax_rate),
      tax_amount: parseFloat(est.tax_amount),
      total: parseFloat(est.total),
      items: typeof est.items === 'string' ? JSON.parse(est.items) : est.items,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch estimate' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized: unauth } = await requireAuth();
    if (unauth) return unauth;
    const { id } = await params;
    const body = await request.json();

    const result = await query('SELECT * FROM estimates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const allowed = pickAllowed(body, ESTIMATE_WRITE_FIELDS);
    const updates = { ...allowed, updated_at: new Date().toISOString() };
    const updated = { ...result.rows[0], ...updates };
    await updateInStore('estimates', id, updates);

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 });
  }
}
