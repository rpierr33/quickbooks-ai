import { NextRequest, NextResponse } from 'next/server';
import { addToStore, listFromStore } from '@/lib/db';
import { requireAuth, requireWrite, requireDelete } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getNumber,
  getEnum,
  getArray,
  ValidationError,
} from '@/lib/validate';

const BILL_STATUSES = ['draft', 'pending', 'paid', 'overdue'] as const;
const PAYMENT_TERMS = ['net15', 'net30', 'net60', 'net90', 'due_on_receipt'] as const;

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const usePagination = pageParam !== null;
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50', 10)), 200);

    const all = await listFromStore('bills');
    const companyBills = all.filter(r => r.company_id === companyId);
    const parsed = companyBills.map(r => ({
      ...r,
      subtotal: parseFloat(r.subtotal),
      tax_rate: parseFloat(r.tax_rate),
      tax_amount: parseFloat(r.tax_amount),
      total: parseFloat(r.total),
      exchange_rate: parseFloat(r.exchange_rate ?? 1),
      base_amount: parseFloat(r.base_amount ?? r.total),
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items ?? []),
    })) as Array<Record<string, any>>;

    // Sort by bill_date desc
    parsed.sort((a, b) =>
      new Date(b.bill_date || b.created_at).getTime() -
      new Date(a.bill_date || a.created_at).getTime()
    );

    if (usePagination) {
      const total = parsed.length;
      const offset = (page - 1) * limit;
      return NextResponse.json({
        data: parsed.slice(offset, offset + limit),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('bills.GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

interface BillLineItem {
  description?: unknown;
  category?: unknown;
  quantity?: unknown;
  rate?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const body = asRecord(await request.json());

    const vendor_name = getString(body, 'vendor_name', { required: true, max: 200 })!;
    const vendor_email = getString(body, 'vendor_email', { max: 255 });
    const bill_date = getString(body, 'bill_date', { required: true, max: 40 })!;
    const due_date = getString(body, 'due_date', { max: 40 });
    const tax_rate = getNumber(body, 'tax_rate', { min: 0, max: 100 }) ?? 0;
    const notes = getString(body, 'notes', { max: 2000 });
    const currency = getString(body, 'currency', { max: 10 }) ?? 'USD';
    const exchange_rate = getNumber(body, 'exchange_rate', { min: 0 }) ?? 1.0;
    const payment_terms = getEnum(body, 'payment_terms', PAYMENT_TERMS) ?? 'net30';
    const rawItems = getArray(body, 'items', { required: true, min: 1 });

    // Validate line items
    const items = (rawItems as BillLineItem[]).map((it, i) => {
      if (!it || typeof it !== 'object') {
        throw new ValidationError(`items[${i}] must be an object`);
      }
      const description = typeof it.description === 'string' ? it.description.trim() : '';
      const category = typeof it.category === 'string' ? it.category.trim() : 'Other';
      const quantity = Number(it.quantity);
      const rate = Number(it.rate);
      if (!description) throw new ValidationError(`items[${i}].description is required`);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new ValidationError(`items[${i}].quantity must be > 0`);
      }
      if (!Number.isFinite(rate) || rate < 0) {
        throw new ValidationError(`items[${i}].rate must be >= 0`);
      }
      return { description, category, quantity, rate, amount: quantity * rate };
    });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (tax_rate / 100);
    const total = subtotal + taxAmount;
    const base_amount = parseFloat((total * exchange_rate).toFixed(2));

    // Generate bill number scoped to company
    const all = await listFromStore('bills');
    const companyBills = all.filter(r => r.company_id === companyId);
    const num = (companyBills.length + 1).toString().padStart(4, '0');

    const newBill = {
      id: crypto.randomUUID(),
      company_id: companyId,
      bill_number: `BILL-${num}`,
      vendor_name,
      vendor_email: vendor_email ?? null,
      items: JSON.stringify(items),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_rate: parseFloat(tax_rate.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      currency,
      exchange_rate: parseFloat(exchange_rate.toFixed(6)),
      base_amount,
      status: 'draft' as const,
      bill_date,
      due_date: due_date ?? null,
      paid_date: null,
      payment_terms,
      notes: notes ?? null,
      scheduled_payment_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('bills', newBill);
    return NextResponse.json({ ...newBill, items }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('bills.POST failed', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
