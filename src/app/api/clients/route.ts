import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    // Build client data from invoices + estimates
    const invoicesResult = await query('SELECT * FROM invoices ORDER BY created_at DESC');
    const estimatesResult = await query('SELECT * FROM estimates ORDER BY created_at DESC');

    const clientMap = new Map<string, {
      name: string;
      email: string | null;
      type: 'client' | 'vendor' | 'both';
      total_invoiced: number;
      total_paid: number;
      outstanding_balance: number;
      invoice_count: number;
      last_activity: string;
    }>();

    for (const inv of invoicesResult.rows) {
      const key = inv.client_name;
      const existing = clientMap.get(key);
      const total = parseFloat(inv.total);
      const isPaid = inv.status === 'paid';

      if (existing) {
        existing.total_invoiced += total;
        if (isPaid) existing.total_paid += total;
        if (!isPaid && inv.status !== 'draft') existing.outstanding_balance += total;
        existing.invoice_count += 1;
        if (!existing.email && inv.client_email) existing.email = inv.client_email;
        if (inv.created_at > existing.last_activity) existing.last_activity = inv.created_at;
      } else {
        clientMap.set(key, {
          name: inv.client_name,
          email: inv.client_email || null,
          type: 'client',
          total_invoiced: total,
          total_paid: isPaid ? total : 0,
          outstanding_balance: !isPaid && inv.status !== 'draft' ? total : 0,
          invoice_count: 1,
          last_activity: inv.created_at,
        });
      }
    }

    // Also gather from estimates
    for (const est of estimatesResult.rows) {
      const key = est.client_name;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: est.client_name,
          email: est.client_email || null,
          type: 'client',
          total_invoiced: 0,
          total_paid: 0,
          outstanding_balance: 0,
          invoice_count: 0,
          last_activity: est.created_at,
        });
      }
    }

    // Build vendor data from expense transactions
    const txResult = await query('SELECT * FROM transactions ORDER BY date DESC');
    const vendorDescriptions = new Set<string>();
    for (const tx of txResult.rows) {
      if (tx.type === 'expense' && tx.description) {
        // Extract vendor name from description (before ' - ')
        const parts = tx.description.split(' - ');
        const vendor = parts[0].replace(/^(Payment to|Paid|Bill from)\s+/i, '').trim();
        if (vendor && !clientMap.has(vendor)) {
          vendorDescriptions.add(vendor);
        }
      }
    }

    const clients = Array.from(clientMap.values()).map((c, i) => ({
      id: `client-${i + 1}`,
      ...c,
      phone: null,
      company: null,
      address: null,
      tax_id: null,
      notes: null,
      is_active: true,
      created_at: c.last_activity,
      updated_at: c.last_activity,
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Clients error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const { name, email, phone, company, address, tax_id, type, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newClient = {
      id: crypto.randomUUID(),
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      address: address || null,
      tax_id: tax_id || null,
      type: type || 'client',
      total_invoiced: 0,
      total_paid: 0,
      outstanding_balance: 0,
      notes: notes || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addToStore('clients', newClient);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
