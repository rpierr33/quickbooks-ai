import { NextResponse } from 'next/server';
import { query, listFromStore, pool } from '@/lib/db';
import { generateInsights } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    let existingRows: Record<string, any>[];
    let txRows: Record<string, any>[];

    if (pool) {
      const existing = await query(
        'SELECT * FROM insights WHERE company_id = $1 ORDER BY created_at DESC LIMIT 10',
        [companyId]
      );
      existingRows = existing.rows;
      if (existingRows.length > 0) {
        return NextResponse.json(existingRows);
      }
      const txRes = await query(
        'SELECT * FROM transactions WHERE company_id = $1 ORDER BY date DESC',
        [companyId]
      );
      txRows = txRes.rows;
    } else {
      const allIns = await listFromStore('insights');
      existingRows = allIns
        .filter(i => i.company_id === companyId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      if (existingRows.length > 0) {
        return NextResponse.json(existingRows);
      }
      const allTx = await listFromStore('transactions');
      txRows = allTx.filter(t => t.company_id === companyId);
    }

    const summary = txRows.map(t =>
      `${t.date} | ${t.type} | ${t.description} | $${parseFloat(t.amount).toFixed(2)}`
    ).join('\n');

    const insights = await generateInsights(summary);
    return NextResponse.json(insights);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
