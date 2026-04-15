import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { requireAuth, requireWrite, requireDelete } from '@/lib/auth-guard';
import { pickAllowed } from '@/lib/validate';

const ESTIMATE_WRITE_FIELDS = ['client_name', 'client_email', 'items', 'tax_rate', 'valid_until', 'notes', 'status'] as const;

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
    const offset = (page - 1) * limit;

    const { pool: dbPool } = await import('@/lib/db');

    if (dbPool && usePagination) {
      const countResult = await query(
        'SELECT COUNT(*) FROM estimates WHERE company_id = $1',
        [companyId]
      );
      const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

      const result = await query(
        'SELECT * FROM estimates WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [companyId, limit, offset]
      );
      const rows = result.rows.map(r => ({
        ...r,
        subtotal: parseFloat(r.subtotal),
        tax_rate: parseFloat(r.tax_rate),
        tax_amount: parseFloat(r.tax_amount),
        total: parseFloat(r.total),
        items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      }));
      return NextResponse.json({
        data: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    const result = await query(
      'SELECT * FROM estimates WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
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
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized: unauth, session } = await requireWrite();
    if (unauth) return unauth;
    const companyId = (session?.user as any)?.companyId;
    const rawBody = await request.json();
    const body = pickAllowed(rawBody, ESTIMATE_WRITE_FIELDS) as Record<string, unknown>;
    const { client_name, client_email, items, tax_rate, valid_until, notes, status } = body as {
      client_name?: unknown;
      client_email?: unknown;
      items?: unknown[];
      tax_rate?: unknown;
      valid_until?: unknown;
      notes?: unknown;
      status?: unknown;
    };

    if (!client_name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Client name and items are required' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    const parsedTaxRate = parseFloat(String(tax_rate)) || 0;
    const taxAmount = subtotal * (parsedTaxRate / 100);
    const total = subtotal + taxAmount;

    // Generate estimate number scoped to company
    const existing = await query(
      'SELECT * FROM estimates WHERE company_id = $1',
      [companyId]
    );
    const num = (existing.rows.length + 1).toString().padStart(3, '0');

    const newEstimate = {
      id: crypto.randomUUID(),
      company_id: companyId,
      estimate_number: `EST-${num}`,
      client_name,
      client_email: client_email || null,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_rate: parseFloat(parsedTaxRate.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      status: status || 'draft',
      valid_until: valid_until || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('estimates', newEstimate);
    return NextResponse.json(newEstimate, { status: 201 });
  } catch (error) {
    console.error('estimates.POST failed:', error);
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 });
  }
}
