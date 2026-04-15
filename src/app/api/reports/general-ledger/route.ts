import { NextRequest, NextResponse } from 'next/server';
import { query, listFromStore, pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    let accRows: Record<string, any>[];
    let txRows: Record<string, any>[];

    if (pool) {
      const [accRes, txRes] = await Promise.all([
        query('SELECT * FROM accounts WHERE company_id = $1', [companyId]),
        query('SELECT * FROM transactions WHERE company_id = $1 ORDER BY date ASC', [companyId]),
      ]);
      accRows = accRes.rows;
      txRows = txRes.rows;
    } else {
      const [allAcc, allTx] = await Promise.all([
        listFromStore('accounts'),
        listFromStore('transactions'),
      ]);
      accRows = allAcc.filter(a => a.company_id === companyId);
      txRows = allTx.filter(t => t.company_id === companyId).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    }

    const filteredTx = txRows.filter(t => new Date(t.date) >= startDate);

    const accounts = accRows.map(acc => {
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
