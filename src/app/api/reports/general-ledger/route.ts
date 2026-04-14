import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');

    const accountsResult = await query('SELECT * FROM accounts');
    const txResult = await query('SELECT * FROM transactions ORDER BY date ASC');
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const filteredTx = txResult.rows.filter(t => new Date(t.date) >= startDate);

    const accounts = accountsResult.rows.map(acc => {
      const openingBalance = parseFloat(acc.balance);
      const accountTx = filteredTx.filter(t => t.account_id === acc.id);

      let runningBalance = openingBalance;
      const entries = accountTx.map(tx => {
        const amount = parseFloat(tx.amount);
        const isDebitNormal = acc.type === 'asset' || acc.type === 'expense';
        const debit = tx.type === 'expense' || (tx.type === 'income' && !isDebitNormal) ? amount : 0;
        const credit = tx.type === 'income' || (tx.type === 'expense' && !isDebitNormal) ? amount : 0;

        if (isDebitNormal) {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        return {
          date: tx.date,
          description: tx.description,
          debit: parseFloat(debit.toFixed(2)),
          credit: parseFloat(credit.toFixed(2)),
          balance: parseFloat(runningBalance.toFixed(2)),
        };
      });

      return {
        account_id: acc.id,
        account_name: acc.name,
        account_type: acc.type,
        opening_balance: openingBalance,
        entries,
        closing_balance: entries.length > 0 ? entries[entries.length - 1].balance : openingBalance,
      };
    });

    // Only return accounts with activity
    const activeAccounts = accounts.filter(a => a.entries.length > 0);

    return NextResponse.json({
      period_start: startDate.toISOString(),
      period_end: now.toISOString(),
      accounts: activeAccounts,
    });
  } catch (error) {
    console.error('General ledger error:', error);
    return NextResponse.json({ error: 'Failed to generate general ledger' }, { status: 500 });
  }
}
