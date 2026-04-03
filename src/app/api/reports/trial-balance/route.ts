import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const accountsResult = await query('SELECT * FROM accounts');
    const now = new Date();

    let totalDebits = 0;
    let totalCredits = 0;

    const rows = accountsResult.rows.map(acc => {
      const balance = parseFloat(acc.balance);
      // Normal balance rules: Assets & Expenses are debit-normal, Liabilities, Equity, Revenue are credit-normal
      const isDebitNormal = acc.type === 'asset' || acc.type === 'expense';
      const debit = isDebitNormal ? balance : 0;
      const credit = isDebitNormal ? 0 : balance;

      totalDebits += debit;
      totalCredits += credit;

      return {
        account_id: acc.id,
        account_name: acc.name,
        account_type: acc.type,
        debit: parseFloat(debit.toFixed(2)),
        credit: parseFloat(credit.toFixed(2)),
      };
    });

    // Sort by type then name
    const typeOrder = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    rows.sort((a, b) => {
      const aIdx = typeOrder.indexOf(a.account_type);
      const bIdx = typeOrder.indexOf(b.account_type);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.account_name.localeCompare(b.account_name);
    });

    return NextResponse.json({
      as_of: now.toISOString(),
      rows,
      total_debits: parseFloat(totalDebits.toFixed(2)),
      total_credits: parseFloat(totalCredits.toFixed(2)),
    });
  } catch (error) {
    console.error('Trial balance error:', error);
    return NextResponse.json({ error: 'Failed to generate trial balance' }, { status: 500 });
  }
}
