/**
 * Public invoice lookup — no auth required.
 * Used by the /pay/[invoiceId] page which is accessible without login.
 * Returns only the fields needed to render the payment page:
 * id, invoice_number, client_name, client_email, status, due_date,
 * items, subtotal, tax_rate, tax_amount, total, notes.
 * Does NOT expose internal fields (company_id, created_at, etc.).
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Public-safe field allowlist — omit company_id and audit fields
const PUBLIC_FIELDS = [
  'id',
  'invoice_number',
  'client_name',
  'client_email',
  'status',
  'due_date',
  'items',
  'subtotal',
  'tax_rate',
  'tax_amount',
  'total',
  'notes',
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    if (!invoiceId || typeof invoiceId !== 'string') {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const result = await query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const inv = result.rows[0];

    // Only expose public-safe fields
    const publicInvoice: Record<string, unknown> = {};
    for (const field of PUBLIC_FIELDS) {
      publicInvoice[field] = inv[field];
    }

    // Parse numeric strings from DECIMAL columns
    publicInvoice.subtotal = parseFloat(inv.subtotal);
    publicInvoice.tax_rate = parseFloat(inv.tax_rate);
    publicInvoice.tax_amount = parseFloat(inv.tax_amount);
    publicInvoice.total = parseFloat(inv.total);
    publicInvoice.items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;

    return NextResponse.json(publicInvoice);
  } catch (error) {
    console.error('public/invoice GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}
