import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');

    const result = await query('SELECT * FROM transactions ORDER BY date DESC');
    const categories = await query('SELECT * FROM categories');
    const categoryMap = Object.fromEntries(categories.rows.map(c => [c.id, c.name]));

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const transactions = result.rows.filter(t => new Date(t.date) >= startDate);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    // Group by category
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    transactions.forEach(t => {
      const catName = categoryMap[t.category_id] || 'Uncategorized';
      const amt = parseFloat(t.amount);
      if (t.type === 'income') {
        incomeByCategory[catName] = (incomeByCategory[catName] || 0) + amt;
      } else if (t.type === 'expense') {
        expensesByCategory[catName] = (expensesByCategory[catName] || 0) + amt;
      }
    });

    // Monthly breakdown
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
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
      period_start: startDate.toISOString().split('T')[0],
      period_end: now.toISOString().split('T')[0],
      total_income: parseFloat(totalIncome.toFixed(2)),
      total_expenses: parseFloat(totalExpenses.toFixed(2)),
      net_profit: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      income_by_category: Object.entries(incomeByCategory).map(([category, amount]) => ({
        category,
        amount: parseFloat(amount.toFixed(2)),
      })),
      expenses_by_category: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount: parseFloat(amount.toFixed(2)),
      })).sort((a, b) => b.amount - a.amount),
      monthly_data: monthlyData,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate P&L report' }, { status: 500 });
  }
}
