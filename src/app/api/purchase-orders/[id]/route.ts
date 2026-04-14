import { NextRequest, NextResponse } from 'next/server';
import { listFromStore, updateInStore, deleteFromStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getNumber,
  getEnum,
  getArray,
  pickAllowed,
  ValidationError,
} from '@/lib/validate';

const PO_WRITE_FIELDS = [
  'vendor_name',
  'vendor_email',
  'items',
  'tax_rate',
  'shipping_address',
  'expected_date',
  'notes',
  'status',
] as const;
const PO_STATUSES = ['draft', 'sent', 'received', 'partial', 'closed'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const rows = await listFromStore('purchase_orders');
    const existing = rows.find(r => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, PO_WRITE_FIELDS);

    const patch: Record<string, unknown> = {};
    if ('vendor_name' in allowed) patch.vendor_name = getString(body, 'vendor_name', { required: true, max: 300 });
    if ('vendor_email' in allowed) patch.vendor_email = getString(body, 'vendor_email', { max: 300 });
    if ('status' in allowed) patch.status = getEnum(body, 'status', PO_STATUSES, { required: true });
    if ('shipping_address' in allowed) patch.shipping_address = getString(body, 'shipping_address', { max: 500 });
    if ('expected_date' in allowed) patch.expected_date = getString(body, 'expected_date', { max: 40 });
    if ('notes' in allowed) patch.notes = getString(body, 'notes', { max: 2000 });

    if ('items' in allowed || 'tax_rate' in allowed) {
      const rawItems = 'items' in allowed
        ? (getArray(body, 'items', { required: true, min: 1 }) ?? [])
        : (typeof existing.items === 'string' ? JSON.parse(existing.items) : (existing.items ?? []));
      const rawTaxRate = 'tax_rate' in allowed
        ? (getNumber(body, 'tax_rate', { min: 0, max: 100 }) ?? 0)
        : parseFloat(existing.tax_rate ?? 0);

      let subtotal = 0;
      const validatedItems = (rawItems as any[]).map((item: any) => {
        const qty = parseFloat(item.quantity ?? 0);
        const price = parseFloat(item.unit_price ?? 0);
        const amount = parseFloat((qty * price).toFixed(2));
        subtotal += amount;
        return {
          description: String(item.description ?? '').trim(),
          quantity: qty,
          unit_price: price,
          amount,
        };
      });
      subtotal = parseFloat(subtotal.toFixed(2));
      const tax_amount = parseFloat((subtotal * (rawTaxRate / 100)).toFixed(2));
      patch.items = JSON.stringify(validatedItems);
      patch.subtotal = subtotal;
      patch.tax_rate = rawTaxRate;
      patch.tax_amount = tax_amount;
      patch.total = parseFloat((subtotal + tax_amount).toFixed(2));
    }

    patch.updated_at = new Date().toISOString();

    const updated = await updateInStore('purchase_orders', id, patch);
    const result = updated ?? { ...existing, ...patch };
    return NextResponse.json({
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : (result.items ?? []),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('purchase-orders[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 });
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

    const rows = await listFromStore('purchase_orders');
    const existing = rows.find(r => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }
    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft purchase orders can be deleted' }, { status: 400 });
    }

    await deleteFromStore('purchase_orders', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('purchase-orders[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 });
  }
}
