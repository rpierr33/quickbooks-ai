import { NextResponse } from 'next/server';
import { query, listFromStore, pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    let transactions: Record<string, any>[];
    let accounts: Record<string, any>[];
    let insights: Record<string, any>[];
    let invoices: Record<string, any>[];

    if (pool) {
      const [txRes, accRes, insRes, invRes] = await Promise.all([
        query('SELECT * FROM transactions WHERE company_id = $1 ORDER BY date DESC', [companyId]),
        query('SELECT * FROM accounts WHERE company_id = $1', [companyId]),
        query('SELECT * FROM insights WHERE company_id = $1 ORDER BY created_at DESC LIMIT 5', [companyId]),
        query('SELECT * FROM invoices WHERE company_id = $1', [companyId]),
      ]);
      transactions = txRes.rows;
      accounts = accRes.rows;
      insights = insRes.rows;
      invoices = invRes.rows;
    } else {
      const [allTx, allAcc, allIns, allInv] = await Promise.all([
        listFromStore('transactions'),
        listFromStore('accounts'),
        listFromStore('insights'),
        listFromStore('invoices'),
      ]);
      transactions = allTx.filter(t => t.company_id === companyId);
      transactions.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      accounts = allAcc.filter(a => a.company_id === companyId);
      insights = allIns
        .filter(i => i.company_id === companyId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      invoices = allInv.filter(i => i.company_id === companyId);
    }

    // Current period (last 30 days)
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

    const cashBalance = accounts
      .filter(a => a.type === 'asset')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);

    const recentTx = transactions.slice(0, 5).map(t => ({
      ...t,
      amount: parseFloat(t.amount),
    }));

    const invoiceOverdue = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const invoicePaid30d = invoices
      .filter(inv => inv.status === 'paid' && inv.paid_date && new Date(inv.paid_date) >= thirtyDaysAgo)
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

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
      insights,
      monthly_data: monthlyData,
      invoice_overdue: parseFloat(invoiceOverdue.toFixed(2)),
      invoice_paid_30d: parseFloat(invoicePaid30d.toFixed(2)),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
