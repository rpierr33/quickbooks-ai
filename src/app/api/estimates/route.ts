import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { requireAuth, requireWrite, requireDelete } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
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
    const body = await request.json();
    const { client_name, client_email, items, tax_rate, valid_until, notes, status } = body;

    if (!client_name || !items || items.length === 0) {
      return NextResponse.json({ error: 'Client name and items are required' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    const parsedTaxRate = parseFloat(tax_rate) || 0;
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
    return NextResponse.json({ error: 'Failed to create estimate', detail: String(error) }, { status: 500 });
  }
}
