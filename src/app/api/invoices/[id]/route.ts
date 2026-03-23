import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updated = { ...result.rows[0], ...body, updated_at: new Date().toISOString() };
    if (body.status === 'paid' && !updated.paid_date) {
      updated.paid_date = new Date().toISOString().split('T')[0];
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
