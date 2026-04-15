import { NextRequest, NextResponse } from 'next/server';
import { query, listFromStore, pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

const ESTIMATED_TAX_RATE = 0.25;

const DEDUCTIBLE_CATEGORIES = [
  'Rent', 'Utilities', 'Payroll', 'Marketing', 'Software & SaaS',
  'Office Supplies', 'Travel', 'Meals & Entertainment', 'Insurance',
  'Professional Services',
];

function rangeToStartDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case '1m': return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    case '3m': return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case '6m': return new Date(now.getFullYear(), now.getMonth() - 6, 1);
    case '1y': return new Date(now.getFullYear() - 1, now.getMonth(), 1);
    case 'all': return new Date(2000, 0, 1);
    case 'ytd':
    default: return new Date(now.getFullYear(), 0, 1);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'ytd';

    let txRows: Record<string, any>[];
    let catRows: Record<string, any>[];

    if (pool) {
      const [txRes, catRes] = await Promise.all([
        query('SELECT * FROM transactions WHERE company_id = $1 ORDER BY date DESC', [companyId]),
        query('SELECT * FROM categories WHERE company_id = $1 OR is_system = true', [companyId]),
      ]);
      txRows = txRes.rows;
      catRows = catRes.rows;
    } else {
      const [allTx, allCat] = await Promise.all([
        listFromStore('transactions'),
        listFromStore('categories'),
      ]);
      txRows = allTx.filter(t => t.company_id === companyId);
      catRows = allCat.filter(c => c.company_id === companyId || c.is_system === true);
    }

    const categoryMap: Record<string, string> = {};
    for (const c of catRows) {
      categoryMap[c.id] = c.name;
    }

    const now = new Date();
    const yearStart = rangeToStartDate(range);
    const ytdTransactions = txRows.filter(t => new Date(t.date) >= yearStart);

    const totalIncome = ytdTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

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
