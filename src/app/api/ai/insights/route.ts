import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateInsights } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    // Get existing insights from DB
    const existing = await query('SELECT * FROM insights ORDER BY created_at DESC LIMIT 10');

    if (existing.rows.length > 0) {
      return NextResponse.json(existing.rows);
    }

    // Generate new insights
    const txResult = await query('SELECT * FROM transactions ORDER BY date DESC');
    const transactions = txResult.rows;

    const summary = transactions.map(t =>
      `${t.date} | ${t.type} | ${t.description} | $${parseFloat(t.amount).toFixed(2)}`
    ).join('\n');

    const insights = await generateInsights(summary);

    return NextResponse.json(insights);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
