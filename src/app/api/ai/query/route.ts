import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { processNLPQuery } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Build transaction summary for context
    const txResult = await query('SELECT * FROM transactions ORDER BY date DESC');
    const transactions = txResult.rows;

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    // Group expenses by category
    const categories = await query('SELECT * FROM categories');
    const categoryMap = Object.fromEntries(categories.rows.map(c => [c.id, c.name]));

    const expensesByCategory: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categoryMap[t.category_id] || 'Other';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + parseFloat(t.amount);
    });

    const summary = [
      `Total Income: $${totalIncome.toFixed(2)}`,
      `Total Expenses: $${totalExpenses.toFixed(2)}`,
      `Net Profit: $${(totalIncome - totalExpenses).toFixed(2)}`,
      `Transaction count: ${transactions.length}`,
      `Expenses by category:`,
      ...Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`),
    ].join('\n');

    const result = await processNLPQuery(question, summary);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 });
  }
}
