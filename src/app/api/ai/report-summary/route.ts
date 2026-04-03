import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const previousMonthName = previousMonthStart.toLocaleDateString('en-US', { month: 'long' });

    // Fetch all data
    const [txResult, catResult, invoiceResult, accountResult] = await Promise.all([
      query('SELECT * FROM transactions ORDER BY date DESC'),
      query('SELECT * FROM categories'),
      query('SELECT * FROM invoices ORDER BY created_at DESC'),
      query('SELECT * FROM accounts WHERE is_active = true'),
    ]);

    const categoryMap = Object.fromEntries(catResult.rows.map(c => [c.id, c.name]));

    // Filter transactions by current month and previous month
    const currentMonthTx = txResult.rows.filter(t => {
      const d = new Date(t.date);
      return d >= currentMonthStart && d <= now;
    });

    const previousMonthTx = txResult.rows.filter(t => {
      const d = new Date(t.date);
      return d >= previousMonthStart && d <= previousMonthEnd;
    });

    // Current month metrics
    const currentIncome = currentMonthTx
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const currentExpenses = currentMonthTx
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const netProfit = currentIncome - currentExpenses;

    // Previous month metrics
    const previousIncome = previousMonthTx
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const previousExpenses = previousMonthTx
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    // Growth percentages
    const incomeGrowth = previousIncome > 0
      ? ((currentIncome - previousIncome) / previousIncome) * 100
      : 0;
    const expenseGrowth = previousExpenses > 0
      ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
      : 0;

    // Expense categories for current month
    const expensesByCategory: Record<string, number> = {};
    currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
      const catName = categoryMap[t.category_id] || 'Uncategorized';
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + parseFloat(t.amount);
    });

    const sortedExpenseCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a);
    const topExpenseCategory = sortedExpenseCategories[0] || null;
    const topExpensePct = topExpenseCategory && currentExpenses > 0
      ? ((topExpenseCategory[1] / currentExpenses) * 100).toFixed(0)
      : '0';

    // Largest single transaction this month
    const largestTx = currentMonthTx.reduce<{ description: string; amount: number; type: string } | null>(
      (max, t) => {
        const amt = parseFloat(t.amount);
        if (!max || amt > max.amount) return { description: t.description, amount: amt, type: t.type };
        return max;
      },
      null
    );

    // Overdue invoices
    const overdueInvoices = invoiceResult.rows.filter(inv => {
      if (inv.status === 'paid' || inv.status === 'draft') return false;
      if (!inv.due_date) return false;
      return new Date(inv.due_date) < now;
    });
    const overdueTotal = overdueInvoices.reduce((s, inv) => s + parseFloat(inv.total), 0);

    // Cash position (sum of asset accounts)
    const cashPosition = accountResult.rows
      .filter(a => a.type === 'asset')
      .reduce((s, a) => s + parseFloat(a.balance), 0);

    // Profit margin
    const profitMargin = currentIncome > 0 ? (netProfit / currentIncome) * 100 : 0;

    // Format currency helper
    const fmt = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // ---- Build narrative summary ----
    const parts: string[] = [];

    // Revenue sentence
    if (currentIncome > 0) {
      let revenueSentence = `In ${currentMonthName}, your business generated ${fmt(currentIncome)} in revenue`;
      if (previousIncome > 0 && incomeGrowth !== 0) {
        const direction = incomeGrowth > 0 ? 'increase' : 'decrease';
        revenueSentence += `, a ${Math.abs(incomeGrowth).toFixed(1)}% ${direction} over ${previousMonthName}`;
      }
      revenueSentence += '.';
      parts.push(revenueSentence);
    } else {
      parts.push(`In ${currentMonthName}, no revenue has been recorded yet.`);
    }

    // Expenses and net profit
    if (currentExpenses > 0) {
      parts.push(`Total expenses were ${fmt(currentExpenses)}, bringing net ${netProfit >= 0 ? 'profit' : 'loss'} to ${fmt(netProfit)}.`);
    }

    // Top expense category
    if (topExpenseCategory) {
      parts.push(`Your largest expense category was ${topExpenseCategory[0]} at ${fmt(topExpenseCategory[1])} (${topExpensePct}% of total expenses).`);
    }

    // Overdue invoices
    if (overdueInvoices.length > 0) {
      const clientNames = [...new Set(overdueInvoices.map(inv => inv.client_name))];
      const clientStr = clientNames.length <= 2
        ? clientNames.join(' and ')
        : `${clientNames.length} clients`;
      parts.push(`You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} totaling ${fmt(overdueTotal)} from ${clientStr}.`);
    }

    // Cash position
    if (cashPosition > 0) {
      parts.push(`Cash position remains ${cashPosition > currentExpenses * 2 ? 'stable' : 'tight'} at ${fmt(cashPosition)}.`);
    }

    const summary_text = parts.join(' ');

    // ---- Build highlights ----
    const highlights: string[] = [];
    if (incomeGrowth > 0) {
      highlights.push(`Revenue grew ${incomeGrowth.toFixed(1)}% compared to ${previousMonthName}.`);
    }
    if (netProfit > 0) {
      highlights.push(`Business is profitable with a ${profitMargin.toFixed(1)}% profit margin.`);
    }
    if (currentIncome > 0 && expenseGrowth < 0) {
      highlights.push(`Expenses decreased ${Math.abs(expenseGrowth).toFixed(1)}% while revenue remained strong.`);
    }
    if (cashPosition > currentExpenses * 3) {
      highlights.push(`Strong cash reserves: ${fmt(cashPosition)} covers ${(cashPosition / currentExpenses).toFixed(0)}+ months of expenses.`);
    }
    // Fallback highlights
    if (highlights.length === 0 && currentIncome > 0) {
      highlights.push(`Revenue of ${fmt(currentIncome)} recorded this month.`);
    }
    if (highlights.length < 2 && currentMonthTx.length > 0) {
      highlights.push(`${currentMonthTx.length} transactions processed this month.`);
    }

    // ---- Build warnings ----
    const warnings: string[] = [];
    if (netProfit < 0) {
      warnings.push(`Net loss of ${fmt(Math.abs(netProfit))} this month. Expenses exceed revenue.`);
    }
    if (overdueInvoices.length > 0) {
      warnings.push(`${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} totaling ${fmt(overdueTotal)} need${overdueInvoices.length === 1 ? 's' : ''} follow-up.`);
    }
    if (expenseGrowth > 15) {
      warnings.push(`Expenses rose ${expenseGrowth.toFixed(1)}% over last month. Review spending.`);
    }
    if (cashPosition > 0 && cashPosition < currentExpenses * 1.5) {
      warnings.push(`Cash reserves are low relative to monthly expenses.`);
    }

    return NextResponse.json({
      period: currentMonthName,
      summary_text,
      highlights: highlights.slice(0, 3),
      warnings: warnings.slice(0, 2),
      metrics: {
        total_income: parseFloat(currentIncome.toFixed(2)),
        total_expenses: parseFloat(currentExpenses.toFixed(2)),
        net_profit: parseFloat(netProfit.toFixed(2)),
        income_growth_pct: parseFloat(incomeGrowth.toFixed(1)),
        expense_growth_pct: parseFloat(expenseGrowth.toFixed(1)),
        profit_margin_pct: parseFloat(profitMargin.toFixed(1)),
        top_expense_category: topExpenseCategory ? { name: topExpenseCategory[0], amount: parseFloat(topExpenseCategory[1].toFixed(2)) } : null,
        largest_transaction: largestTx ? { description: largestTx.description, amount: parseFloat(largestTx.amount.toFixed(2)), type: largestTx.type } : null,
        overdue_invoices: { count: overdueInvoices.length, total: parseFloat(overdueTotal.toFixed(2)) },
        cash_position: parseFloat(cashPosition.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Report summary error:', error);
    return NextResponse.json({ error: 'Failed to generate report summary' }, { status: 500 });
  }
}
