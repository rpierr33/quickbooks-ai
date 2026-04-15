import { NextRequest, NextResponse } from 'next/server';
import { addToStore, listFromStore } from '@/lib/db';
import { requireAuth, requireWrite, requireDelete } from '@/lib/auth-guard';
import { asRecord, getString, getNumber, getEnum, getArray, ValidationError } from '@/lib/validate';

const PO_STATUSES = ['draft', 'sent', 'received', 'partial', 'closed'] as const;

function nextPoNumber(existing: Record<string, any>[]): string {
  if (existing.length === 0) return 'PO-001';
  const nums = existing
    .map(r => {
      const m = String(r.po_number ?? '').match(/PO-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `PO-${String(max + 1).padStart(3, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const all = await listFromStore('purchase_orders');
    let rows = all.filter(r => r.company_id === companyId);

    if (status && status !== 'all') {
      rows = rows.filter(r => r.status === status);
    }

    rows = [...rows].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    rows = rows.map(r => ({
      ...r,
      subtotal: parseFloat(r.subtotal ?? 0),
      tax_rate: parseFloat(r.tax_rate ?? 0),
      tax_amount: parseFloat(r.tax_amount ?? 0),
      total: parseFloat(r.total ?? 0),
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items ?? []),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Purchase orders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const body = asRecord(await request.json());
    const vendor_name = getString(body, 'vendor_name', { required: true, max: 300 })!;
    const vendor_email = getString(body, 'vendor_email', { max: 300 });
    const items = getArray(body, 'items', { required: true, min: 1 })!;
    const tax_rate = getNumber(body, 'tax_rate', { min: 0, max: 100 }) ?? 0;
    const shipping_address = getString(body, 'shipping_address', { max: 500 });
    const expected_date = getString(body, 'expected_date', { max: 40 });
    const notes = getString(body, 'notes', { max: 2000 });

    // Calculate totals from items
    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
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
    const tax_amount = parseFloat((subtotal * (tax_rate / 100)).toFixed(2));
    const total = parseFloat((subtotal + tax_amount).toFixed(2));

    const all = await listFromStore('purchase_orders');
    const companyPOs = all.filter(r => r.company_id === companyId);
    const po_number = nextPoNumber(companyPOs);

    const id = crypto.randomUUID();
    const record = {
      id,
      company_id: companyId,
      po_number,
      vendor_name,
      vendor_email: vendor_email ?? null,
      items: JSON.stringify(validatedItems),
      subtotal,
      tax_rate,
      tax_amount,
      total,
      status: 'draft',
      shipping_address: shipping_address ?? null,
      expected_date: expected_date ?? null,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('purchase_orders', record);
    return NextResponse.json({ ...record, items: validatedItems }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Purchase orders POST error:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}
