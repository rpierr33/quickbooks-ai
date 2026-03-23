import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM invoices ORDER BY created_at DESC');
    const rows = result.rows.map(r => ({
      ...r,
      subtotal: parseFloat(r.subtotal),
      tax_rate: parseFloat(r.tax_rate),
      tax_amount: parseFloat(r.tax_amount),
      total: parseFloat(r.total),
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
    }));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_name, client_email, items, tax_rate, due_date, notes } = body;

    if (!client_name || !items || items.length === 0) {
      return NextResponse.json({ error: 'Client name and items are required' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * ((tax_rate || 0) / 100);
    const total = subtotal + taxAmount;

    // Generate invoice number
    const existing = await query('SELECT * FROM invoices');
    const num = (existing.rows.length + 1).toString().padStart(4, '0');

    const newInvoice = {
      id: crypto.randomUUID(),
      invoice_number: `INV-${num}`,
      client_name,
      client_email: client_email || null,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_rate: parseFloat((tax_rate || 0).toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      status: 'draft',
      due_date: due_date || null,
      paid_date: null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
