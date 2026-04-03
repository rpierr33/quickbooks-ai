import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const invoicesResult = await query('SELECT * FROM invoices ORDER BY created_at DESC');
    const now = new Date();

    const buckets: { label: string; min: number; max: number; total: number; clients: Map<string, { name: string; amount: number; invoice_count: number }> }[] = [
      { label: 'Current', min: -Infinity, max: 0, total: 0, clients: new Map() },
      { label: '1-30 days', min: 1, max: 30, total: 0, clients: new Map() },
      { label: '31-60 days', min: 31, max: 60, total: 0, clients: new Map() },
      { label: '61-90 days', min: 61, max: 90, total: 0, clients: new Map() },
      { label: '90+ days', min: 91, max: Infinity, total: 0, clients: new Map() },
    ];

    let totalOutstanding = 0;

    for (const inv of invoicesResult.rows) {
      if (inv.status === 'paid' || inv.status === 'draft') continue;

      const total = parseFloat(inv.total);
      const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.created_at);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      totalOutstanding += total;

      for (const bucket of buckets) {
        if (daysOverdue >= bucket.min && daysOverdue <= bucket.max) {
          bucket.total += total;
          const existing = bucket.clients.get(inv.client_name);
          if (existing) {
            existing.amount += total;
            existing.invoice_count += 1;
          } else {
            bucket.clients.set(inv.client_name, { name: inv.client_name, amount: total, invoice_count: 1 });
          }
          break;
        }
      }
    }

    return NextResponse.json({
      as_of: now.toISOString(),
      total_outstanding: parseFloat(totalOutstanding.toFixed(2)),
      buckets: buckets.map(b => ({
        label: b.label,
        total: parseFloat(b.total.toFixed(2)),
        clients: Array.from(b.clients.values()).sort((a, c) => c.amount - a.amount),
      })),
    });
  } catch (error) {
    console.error('Aged receivables error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
