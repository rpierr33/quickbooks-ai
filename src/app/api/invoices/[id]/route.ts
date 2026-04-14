import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { asRecord, getEnum, getString, getNumber, ValidationError, pickAllowed } from '@/lib/validate';

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'void'] as const;
// Fields a client may legally PATCH on an invoice. Anything not in this
// list is silently dropped to prevent mass-assignment (see CLAUDE.md §Hard rules).
const INVOICE_WRITE_FIELDS = [
  'client_name',
  'client_email',
  'status',
  'due_date',
  'notes',
  'tax_rate',
  'items',
  'discount',
] as const;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const result = await query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const inv = result.rows[0];
    return NextResponse.json({
      ...inv,
      subtotal: parseFloat(inv.subtotal),
      tax_rate: parseFloat(inv.tax_rate),
      tax_amount: parseFloat(inv.tax_amount),
      total: parseFloat(inv.total),
      items: typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items,
    });
  } catch (error) {
    console.error('invoices[id].GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, INVOICE_WRITE_FIELDS);

    // Validate each present field (shape only — missing fields left alone).
    const patch: Record<string, unknown> = {};
    if ('client_name' in allowed) {
      patch.client_name = getString(body, 'client_name', { required: true, max: 200 });
    }
    if ('client_email' in allowed) {
      patch.client_email = getString(body, 'client_email', { max: 255 });
    }
    if ('status' in allowed) {
      patch.status = getEnum(body, 'status', INVOICE_STATUSES, { required: true });
    }
    if ('due_date' in allowed) {
      patch.due_date = getString(body, 'due_date', { max: 40 });
    }
    if ('notes' in allowed) {
      patch.notes = getString(body, 'notes', { max: 2000 });
    }
    if ('tax_rate' in allowed) {
      patch.tax_rate = getNumber(body, 'tax_rate', { min: 0, max: 100 });
    }
    if ('items' in allowed) {
      // items is a JSON array — accept as-is after basic type check
      const rawItems = body.items;
      if (!Array.isArray(rawItems)) throw new ValidationError('items must be an array');
      patch.items = rawItems;
    }
    if ('discount' in allowed) {
      patch.discount = getNumber(body, 'discount', { min: 0 });
    }

    const result = await query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
    if (patch.status === 'paid' && !result.rows[0].paid_date) {
      updates.paid_date = new Date().toISOString().split('T')[0];
    }

    // Recalculate totals when items or tax_rate change
    if ('items' in patch || 'tax_rate' in patch || 'discount' in patch) {
      const items = (patch.items as Array<{ quantity: number; rate: number }> | undefined)
        ?? (typeof result.rows[0].items === 'string' ? JSON.parse(result.rows[0].items) : result.rows[0].items ?? []);
      const taxRate = ('tax_rate' in patch ? (patch.tax_rate as number) : parseFloat(String(result.rows[0].tax_rate))) || 0;
      const discount = ('discount' in patch ? (patch.discount as number) : parseFloat(String(result.rows[0].discount ?? 0))) || 0;
      const subtotal = (items as Array<{ quantity: number; rate: number; amount?: number }>).reduce((s, it) => {
        const amt = it.amount ?? it.quantity * it.rate;
        return s + (typeof amt === 'number' ? amt : parseFloat(String(amt)) || 0);
      }, 0);
      const discounted = subtotal - discount;
      const taxAmount = discounted * (taxRate / 100);
      updates.subtotal = subtotal;
      updates.tax_amount = taxAmount;
      updates.total = discounted + taxAmount;
      updates.items = typeof items === 'string' ? items : JSON.stringify(items);
    }

    const updated = { ...result.rows[0], ...updates };
    updateInStore('invoices', id, updates);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('invoices[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
