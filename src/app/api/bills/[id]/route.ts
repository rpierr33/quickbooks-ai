import { NextRequest, NextResponse } from 'next/server';
import { listFromStore, updateInStore, addToStore, deleteFromStore } from '@/lib/db';
import { requireAuth, requireWrite, requireDelete } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getNumber,
  getEnum,
  ValidationError,
  pickAllowed,
} from '@/lib/validate';

const BILL_STATUSES = ['draft', 'pending', 'paid', 'overdue'] as const;
const PAYMENT_TERMS = ['net15', 'net30', 'net60', 'net90', 'due_on_receipt'] as const;

const BILL_WRITE_FIELDS = [
  'vendor_name',
  'vendor_email',
  'bill_date',
  'due_date',
  'status',
  'tax_rate',
  'items',
  'notes',
  'currency',
  'exchange_rate',
  'payment_terms',
  'scheduled_payment_date',
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { id } = await params;
    const rows = await listFromStore('bills');
    const bill = rows.find(r => r.id === id && r.company_id === companyId);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...bill,
      subtotal: parseFloat(bill.subtotal),
      tax_rate: parseFloat(bill.tax_rate),
      tax_amount: parseFloat(bill.tax_amount),
      total: parseFloat(bill.total),
      exchange_rate: parseFloat(bill.exchange_rate ?? 1),
      base_amount: parseFloat(bill.base_amount ?? bill.total),
      items: typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items ?? []),
    });
  } catch (error) {
    console.error('bills[id].GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { id } = await params;
    const rows = await listFromStore('bills');
    const bill = rows.find(r => r.id === id && r.company_id === companyId);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, BILL_WRITE_FIELDS);

    const patch: Record<string, unknown> = {};

    if ('vendor_name' in allowed) {
      patch.vendor_name = getString(body, 'vendor_name', { required: true, max: 200 });
    }
    if ('vendor_email' in allowed) {
      patch.vendor_email = getString(body, 'vendor_email', { max: 255 });
    }
    if ('bill_date' in allowed) {
      patch.bill_date = getString(body, 'bill_date', { max: 40 });
    }
    if ('due_date' in allowed) {
      patch.due_date = getString(body, 'due_date', { max: 40 });
    }
    if ('status' in allowed) {
      patch.status = getEnum(body, 'status', BILL_STATUSES, { required: true });
    }
    if ('tax_rate' in allowed) {
      patch.tax_rate = getNumber(body, 'tax_rate', { min: 0, max: 100 });
    }
    if ('items' in allowed) {
      const rawItems = body.items;
      if (!Array.isArray(rawItems)) throw new ValidationError('items must be an array');
      patch.items = rawItems;
    }
    if ('notes' in allowed) {
      patch.notes = getString(body, 'notes', { max: 2000 });
    }
    if ('currency' in allowed) {
      patch.currency = getString(body, 'currency', { max: 10 });
    }
    if ('exchange_rate' in allowed) {
      patch.exchange_rate = getNumber(body, 'exchange_rate', { min: 0 });
    }
    if ('payment_terms' in allowed) {
      patch.payment_terms = getEnum(body, 'payment_terms', PAYMENT_TERMS);
    }
    if ('scheduled_payment_date' in allowed) {
      patch.scheduled_payment_date = getString(body, 'scheduled_payment_date', { max: 40 });
    }

    if (patch.status === 'paid' && !bill.paid_date) {
      patch.paid_date = new Date().toISOString().split('T')[0];
    }

    if ('items' in patch || 'tax_rate' in patch) {
      const items = (patch.items as Array<{ quantity: number; rate: number; amount?: number }> | undefined)
        ?? (typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items ?? []);
      const taxRate = ('tax_rate' in patch ? (patch.tax_rate as number) : parseFloat(String(bill.tax_rate))) || 0;
      const subtotal = (items as Array<{ quantity: number; rate: number; amount?: number }>).reduce(
        (s, it) => s + (it.amount ?? it.quantity * it.rate), 0
      );
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      const exchangeRate = ('exchange_rate' in patch ? (patch.exchange_rate as number) : parseFloat(String(bill.exchange_rate ?? 1))) || 1;
      patch.subtotal = parseFloat(subtotal.toFixed(2));
      patch.tax_amount = parseFloat(taxAmount.toFixed(2));
      patch.total = parseFloat(total.toFixed(2));
      patch.base_amount = parseFloat((total * exchangeRate).toFixed(2));
      if (Array.isArray(patch.items)) {
        patch.items = JSON.stringify(patch.items);
      }
    }

    const updates = { ...patch, updated_at: new Date().toISOString() };
    const updated = await updateInStore('bills', id, updates);

    return NextResponse.json({
      ...bill,
      ...updated,
      items: typeof (updated?.items ?? bill.items) === 'string'
        ? JSON.parse((updated?.items ?? bill.items) as string)
        : (updated?.items ?? bill.items ?? []),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('bills[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireDelete();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { id } = await params;
    const rows = await listFromStore('bills');
    const bill = rows.find(r => r.id === id && r.company_id === companyId);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    const deleted = await deleteFromStore('bills', id);
    if (!deleted) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('bills[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { id } = await params;
    const rows = await listFromStore('bills');
    const bill = rows.find(r => r.id === id && r.company_id === companyId);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const body = asRecord(await request.json());
    const action = getString(body, 'action', { required: true, max: 50 });

    if (action === 'pay') {
      const paidDate = new Date().toISOString().split('T')[0];
      const updates = {
        status: 'paid',
        paid_date: paidDate,
        updated_at: new Date().toISOString(),
      };
      const updated = await updateInStore('bills', id, updates);

      const expenseTransaction = {
        id: crypto.randomUUID(),
        company_id: companyId,
        date: paidDate,
        description: `Bill Payment: ${bill.vendor_name} (${bill.bill_number})`,
        amount: parseFloat(String(bill.base_amount ?? bill.total)),
        type: 'expense',
        account_id: null,
        category_id: null,
        category_name: 'Accounts Payable',
        account_name: null,
        is_recurring: false,
        recurring_rule_id: null,
        ai_categorized: false,
        ai_confidence: null,
        notes: `Auto-created from bill ${bill.bill_number}`,
        attachments: '[]',
        currency: bill.currency ?? 'USD',
        exchange_rate: parseFloat(String(bill.exchange_rate ?? 1)),
        base_amount: parseFloat(String(bill.base_amount ?? bill.total)),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await addToStore('transactions', expenseTransaction);

      return NextResponse.json({ ...bill, ...updated, transaction_id: expenseTransaction.id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('bills[id].PATCH failed', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
