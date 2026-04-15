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
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const statusFilter = url.searchParams.get('status') || '';

    const usePagination = pageParam !== null;
    const page = parseInt(pageParam || '1', 10);
    const limit = Math.min(parseInt(limitParam || '50', 10), 100);
    const offset = (page - 1) * limit;

    const { pool: dbPool } = await import('@/lib/db');

    if (dbPool && usePagination) {
      const params: unknown[] = [companyId];
      let whereClauses = 'company_id = $1';

      if (statusFilter) {
        params.push(statusFilter);
        whereClauses += ` AND status = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        whereClauses += ` AND (client_name ILIKE $${params.length} OR invoice_number ILIKE $${params.length})`;
      }

      const countResult = await query(
        `SELECT COUNT(*) FROM invoices WHERE ${whereClauses}`,
        params as any[]
      );
      const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

      const dataParams = [...params, limit, offset];
      const result = await query(
        `SELECT * FROM invoices WHERE ${whereClauses} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        dataParams as any[]
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

      return NextResponse.json({
        data: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // Non-paginated fallback (mock store path, client handles pagination)
    const result = await query(
      'SELECT * FROM invoices WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    let rows = result.rows;

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r =>
        r.client_name?.toLowerCase().includes(s) || r.invoice_number?.toLowerCase().includes(s)
      );
    }

    const mapped = rows.map(r => ({
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
    return NextResponse.json(mapped);
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
    logAudit({
      companyId: companyId ?? '',
      userId: (session?.user as any)?.id ?? '',
      userEmail: session?.user?.email ?? '',
      action: 'create',
      entityType: 'invoice',
      entityId: newInvoice.id,
      details: { invoice_number: newInvoice.invoice_number, client_name, total: newInvoice.total },
    });
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('invoices.POST failed', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
