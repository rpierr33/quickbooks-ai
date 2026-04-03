import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

const ESTIMATED_TAX_RATE = 0.25;

const DEDUCTIBLE_CATEGORIES = [
  'Rent', 'Utilities', 'Payroll', 'Marketing', 'Software & SaaS',
  'Office Supplies', 'Travel', 'Meals & Entertainment', 'Insurance',
  'Professional Services',
];

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const txResult = await query('SELECT * FROM transactions ORDER BY date DESC');
    const catResult = await query('SELECT * FROM categories');
    const categoryMap: Record<string, string> = {};
    for (const c of catResult.rows) {
      categoryMap[c.id] = c.name;
    }

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const ytdTransactions = txResult.rows.filter(t => new Date(t.date) >= yearStart);

    const totalIncome = ytdTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Group expenses by category
    const expensesByCategory = new Map<string, number>();
    for (const tx of ytdTransactions) {
      if (tx.type === 'expense') {
        const cat = categoryMap[tx.category_id] || tx.category_name || 'Uncategorized';
        expensesByCategory.set(cat, (expensesByCategory.get(cat) || 0) + parseFloat(tx.amount));
      }
    }

    const deductionsByCategory = Array.from(expensesByCategory.entries()).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      is_deductible: DEDUCTIBLE_CATEGORIES.includes(category),
    })).sort((a, b) => b.amount - a.amount);

    const totalDeductions = deductionsByCategory
      .filter(d => d.is_deductible)
      .reduce((sum, d) => sum + d.amount, 0);

    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const estimatedTax = taxableIncome * ESTIMATED_TAX_RATE;

    // Quarterly breakdown
    const quarters = [
      { quarter: 'Q1', start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 3, 0) },
      { quarter: 'Q2', start: new Date(now.getFullYear(), 3, 1), end: new Date(now.getFullYear(), 6, 0) },
      { quarter: 'Q3', start: new Date(now.getFullYear(), 6, 1), end: new Date(now.getFullYear(), 9, 0) },
      { quarter: 'Q4', start: new Date(now.getFullYear(), 9, 1), end: new Date(now.getFullYear(), 12, 0) },
    ];

    const quarterly = quarters.map(q => {
      const qTx = ytdTransactions.filter(t => {
        const d = new Date(t.date);
        return d >= q.start && d <= q.end;
      });
      const income = qTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const expenses = qTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
      const taxable = Math.max(0, income - expenses);

      return {
        quarter: q.quarter,
        income: parseFloat(income.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        estimated_tax: parseFloat((taxable * ESTIMATED_TAX_RATE).toFixed(2)),
      };
    });

    return NextResponse.json({
      period_start: yearStart.toISOString(),
      period_end: now.toISOString(),
      taxable_income: parseFloat(taxableIncome.toFixed(2)),
      total_deductions: parseFloat(totalDeductions.toFixed(2)),
      estimated_tax_liability: parseFloat(estimatedTax.toFixed(2)),
      effective_rate: totalIncome > 0 ? parseFloat(((estimatedTax / totalIncome) * 100).toFixed(1)) : 0,
      deductions_by_category: deductionsByCategory,
      quarterly,
    });
  } catch (error) {
    console.error('Tax summary error:', error);
    return NextResponse.json({ error: 'Failed to generate tax summary' }, { status: 500 });
  }
}
