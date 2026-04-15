import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { requireAuth, requireWrite } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getNumber,
  getArray,
  ValidationError,
} from '@/lib/validate';

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const result = await query(
      'SELECT * FROM invoices WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    const rows = result.rows.map(r => ({
      ...r,
      subtotal: parseFloat(r.subtotal),
      tax_rate: parseFloat(r.tax_rate),
      tax_amount: parseFloat(r.tax_amount),
      total: parseFloat(r.total),
      currency: r.currency ?? 'USD',
      exchange_rate: parseFloat(r.exchange_rate ?? 1) || 1,
      base_amount: parseFloat(r.base_amount ?? r.total) || parseFloat(r.total),
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
    }));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('invoices.GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

interface InvoiceItem {
  description?: unknown;
  quantity?: unknown;
  rate?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const body = asRecord(await request.json());
    const client_name = getString(body, 'client_name', { required: true, max: 200 });
    const client_email = getString(body, 'client_email', { max: 255 });
    const tax_rate = getNumber(body, 'tax_rate', { min: 0, max: 100 }) ?? 0;
    const due_date = getString(body, 'due_date', { max: 40 });
    const notes = getString(body, 'notes', { max: 2000 });
    const currency = getString(body, 'currency', { max: 10 }) ?? 'USD';
    const exchange_rate = getNumber(body, 'exchange_rate', { min: 0 }) ?? 1.0;
    const rawItems = getArray(body, 'items', { required: true, min: 1 });

    // Validate every line item.
    const items = (rawItems as InvoiceItem[]).map((it, i) => {
      if (!it || typeof it !== 'object') {
        throw new ValidationError(`items[${i}] must be an object`);
      }
      const description = typeof it.description === 'string' ? it.description.trim() : '';
      const quantity = Number(it.quantity);
      const rate = Number(it.rate);
      if (!description) throw new ValidationError(`items[${i}].description is required`);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new ValidationError(`items[${i}].quantity must be > 0`);
      }
      if (!Number.isFinite(rate) || rate < 0) {
        throw new ValidationError(`items[${i}].rate must be >= 0`);
      }
      return { description, quantity, rate };
    });

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = subtotal * (tax_rate / 100);
    const total = subtotal + taxAmount;

    // Generate invoice number scoped to this company
    const existing = await query(
      'SELECT * FROM invoices WHERE company_id = $1',
      [companyId]
    );
    const num = (existing.rows.length + 1).toString().padStart(4, '0');

    const base_amount = parseFloat((total * exchange_rate).toFixed(2));

    const newInvoice = {
      id: crypto.randomUUID(),
      company_id: companyId,
      invoice_number: `INV-${num}`,
      client_name,
      client_email: client_email ?? null,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_rate: parseFloat(tax_rate.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      status: 'draft',
      due_date: due_date ?? null,
      paid_date: null,
      notes: notes ?? null,
      currency,
      exchange_rate: parseFloat(exchange_rate.toFixed(6)),
      base_amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('invoices', newInvoice);
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('invoices.POST failed', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
