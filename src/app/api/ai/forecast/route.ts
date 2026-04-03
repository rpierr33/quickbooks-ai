import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    // Fetch all data sources
    const [txResult, accountsResult, recurringResult, invoicesResult] = await Promise.all([
      query('SELECT * FROM transactions ORDER BY date DESC'),
      query('SELECT * FROM accounts'),
      query('SELECT * FROM recurring_transactions'),
      query('SELECT * FROM invoices'),
    ]);

    const transactions = txResult.rows;
    const accounts = accountsResult.rows;
    const recurring = recurringResult.rows;
    const invoices = invoicesResult.rows;

    // ── Current cash balance ──
    const currentBalance = accounts
      .filter(a => a.type === 'asset')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);

    // ── Historical monthly averages (last 6 months) ──
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const recentTx = transactions.filter(t => new Date(t.date) >= sixMonthsAgo);

    // Group by month
    const monthlyBuckets: Record<string, { income: number; expenses: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyBuckets[key] = { income: 0, expenses: 0 };
    }

    for (const tx of recentTx) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyBuckets[key]) {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'income') {
          monthlyBuckets[key].income += amount;
        } else if (tx.type === 'expense') {
          monthlyBuckets[key].expenses += amount;
        }
      }
    }

    const monthKeys = Object.keys(monthlyBuckets);
    const monthCount = monthKeys.length || 1;

    const totalHistoricalIncome = monthKeys.reduce((s, k) => s + monthlyBuckets[k].income, 0);
    const totalHistoricalExpenses = monthKeys.reduce((s, k) => s + monthlyBuckets[k].expenses, 0);

    const avgMonthlyIncome = totalHistoricalIncome / monthCount;
    const avgMonthlyExpenses = totalHistoricalExpenses / monthCount;
    const monthlyBurnRate = avgMonthlyExpenses - avgMonthlyIncome; // positive = burning cash

    // ── Recurring transactions (known future costs) ──
    const activeRecurring = recurring.filter(r => r.is_active);
    let recurringMonthlyCost = 0;
    let recurringMonthlyIncome = 0;

    for (const r of activeRecurring) {
      const amount = parseFloat(r.amount);
      let monthlyAmount = amount;

      // Normalize to monthly
      switch (r.frequency) {
        case 'daily': monthlyAmount = amount * 30; break;
        case 'weekly': monthlyAmount = amount * 4.33; break;
        case 'monthly': monthlyAmount = amount; break;
        case 'yearly': monthlyAmount = amount / 12; break;
      }

      if (r.type === 'expense') {
        recurringMonthlyCost += monthlyAmount;
      } else if (r.type === 'income') {
        recurringMonthlyIncome += monthlyAmount;
      }
    }

    // ── Outstanding invoices (expected incoming payments) ──
    const outstandingInvoices = invoices.filter(
      (inv) => inv.status === 'sent' || inv.status === 'overdue'
    );
    const expectedInvoiceIncome = outstandingInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total),
      0
    );

    // ── Project cash position ──
    // Use a blended approach: weight recurring costs heavily, fill gaps with historical averages
    // Monthly net = avg income + recurring income - max(recurring cost, avg expenses)
    // We use the higher of recurring or historical expenses as a conservative estimate
    const effectiveMonthlyExpenses = Math.max(recurringMonthlyCost, avgMonthlyExpenses);
    const effectiveMonthlyIncome = avgMonthlyIncome + recurringMonthlyIncome;
    const netMonthlyFlow = effectiveMonthlyIncome - effectiveMonthlyExpenses;

    // For 30-day forecast: include outstanding invoices due within 30 days
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const invoicesDue30 = outstandingInvoices
      .filter(inv => inv.due_date && new Date(inv.due_date) <= in30Days)
      .reduce((s, inv) => s + parseFloat(inv.total), 0);

    const invoicesDue60 = outstandingInvoices
      .filter(inv => inv.due_date && new Date(inv.due_date) <= in60Days)
      .reduce((s, inv) => s + parseFloat(inv.total), 0);

    const invoicesDue90 = outstandingInvoices
      .filter(inv => inv.due_date && new Date(inv.due_date) <= in90Days)
      .reduce((s, inv) => s + parseFloat(inv.total), 0);

    const forecast30d = parseFloat((currentBalance + netMonthlyFlow + invoicesDue30).toFixed(2));
    const forecast60d = parseFloat((currentBalance + netMonthlyFlow * 2 + invoicesDue60).toFixed(2));
    const forecast90d = parseFloat((currentBalance + netMonthlyFlow * 3 + invoicesDue90).toFixed(2));

    // ── Runway calculation ──
    // If burning cash (net negative), how many months until $0?
    const effectiveBurnRate = netMonthlyFlow < 0 ? Math.abs(netMonthlyFlow) : 0;
    const monthsOfRunway = effectiveBurnRate > 0
      ? parseFloat((currentBalance / effectiveBurnRate).toFixed(1))
      : 999; // effectively infinite if not burning

    // ── Generate insights ──
    const insights: string[] = [];

    if (effectiveBurnRate > 0) {
      insights.push(
        `At your current burn rate of $${effectiveBurnRate.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/month, you have approximately ${monthsOfRunway} months of runway remaining.`
      );
    } else {
      insights.push(
        `Your business is cash-flow positive, generating approximately $${Math.abs(netMonthlyFlow).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/month in net income.`
      );
    }

    if (expectedInvoiceIncome > 0) {
      const overdueCount = outstandingInvoices.filter(inv => inv.status === 'overdue').length;
      const overdueNote = overdueCount > 0 ? ` (${overdueCount} overdue)` : '';
      insights.push(
        `You have $${expectedInvoiceIncome.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} in outstanding invoices${overdueNote} that could improve your cash position when collected.`
      );
    }

    if (recurringMonthlyCost > 0) {
      const pctOfIncome = avgMonthlyIncome > 0
        ? ((recurringMonthlyCost / avgMonthlyIncome) * 100).toFixed(0)
        : 'N/A';
      insights.push(
        `Recurring expenses total $${recurringMonthlyCost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/month (${pctOfIncome}% of avg monthly income), including rent, insurance, and subscriptions.`
      );
    }

    return NextResponse.json({
      current_balance: parseFloat(currentBalance.toFixed(2)),
      forecast_30d: forecast30d,
      forecast_60d: forecast60d,
      forecast_90d: forecast90d,
      monthly_burn_rate: parseFloat(effectiveBurnRate.toFixed(2)),
      months_of_runway: monthsOfRunway,
      recurring_monthly_cost: parseFloat(recurringMonthlyCost.toFixed(2)),
      expected_invoice_income: parseFloat(expectedInvoiceIncome.toFixed(2)),
      insights,
    });
  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 });
  }
}
