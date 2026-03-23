import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const result = await query('SELECT * FROM transactions ORDER BY date ASC');
    const transactions = result.rows.filter(t => new Date(t.date) >= startDate);

    const totalInflows = transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalOutflows = transactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    // Get account balances for opening/closing
    const accounts = await query('SELECT * FROM accounts WHERE type = \'asset\'');
    const currentBalance = accounts.rows.reduce((s, a) => s + parseFloat(a.balance), 0);
    const openingBalance = currentBalance - (totalInflows - totalOutflows);

    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= monthDate && d <= monthEnd;
      });

      const inflows = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const outflows = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

      monthlyData.push({
        month: monthName,
        inflows: parseFloat(inflows.toFixed(2)),
        outflows: parseFloat(outflows.toFixed(2)),
        net: parseFloat((inflows - outflows).toFixed(2)),
      });
    }

    return NextResponse.json({
      period_start: startDate.toISOString().split('T')[0],
      period_end: now.toISOString().split('T')[0],
      opening_balance: parseFloat(openingBalance.toFixed(2)),
      closing_balance: parseFloat(currentBalance.toFixed(2)),
      total_inflows: parseFloat(totalInflows.toFixed(2)),
      total_outflows: parseFloat(totalOutflows.toFixed(2)),
      net_change: parseFloat((totalInflows - totalOutflows).toFixed(2)),
      monthly_data: monthlyData,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate cash flow report' }, { status: 500 });
  }
}
