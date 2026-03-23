import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Current period (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get all transactions
    const allTx = await query('SELECT * FROM transactions ORDER BY date DESC');
    const transactions = allTx.rows;

    // Calculate totals for current period
    const currentPeriod = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const prevPeriod = transactions.filter(t => new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo);

    const totalIncome = currentPeriod
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = currentPeriod
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const prevIncome = prevPeriod
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const prevExpenses = prevPeriod
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const incomeChange = prevIncome === 0 ? 0 : parseFloat((((totalIncome - prevIncome) / prevIncome) * 100).toFixed(1));
    const expenseChange = prevExpenses === 0 ? 0 : parseFloat((((totalExpenses - prevExpenses) / prevExpenses) * 100).toFixed(1));

    // Cash balance
    const accountsResult = await query('SELECT * FROM accounts');
    const cashBalance = accountsResult.rows
      .filter(a => a.type === 'asset')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);

    // Recent transactions
    const recentTx = transactions.slice(0, 5);

    // Insights
    const insightsResult = await query('SELECT * FROM insights ORDER BY created_at DESC LIMIT 5');

    // Monthly data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= monthDate && d <= monthEnd;
      });

      const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

      monthlyData.push({
        period: monthName,
        income: parseFloat(income.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        net: parseFloat((income - expenses).toFixed(2)),
      });
    }

    return NextResponse.json({
      total_income: parseFloat(totalIncome.toFixed(2)),
      total_expenses: parseFloat(totalExpenses.toFixed(2)),
      net_profit: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      cash_balance: parseFloat(cashBalance.toFixed(2)),
      income_change: incomeChange,
      expense_change: expenseChange,
      recent_transactions: recentTx,
      insights: insightsResult.rows,
      monthly_data: monthlyData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
