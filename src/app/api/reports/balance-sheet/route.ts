import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const result = await query('SELECT * FROM accounts WHERE is_active = true ORDER BY type, name');
    const accounts = result.rows.map(a => ({
      ...a,
      balance: parseFloat(a.balance),
    }));

    const grouped: Record<string, { name: string; balance: number }[]> = {};
    accounts.forEach(a => {
      if (!grouped[a.type]) grouped[a.type] = [];
      grouped[a.type].push({ name: a.name, balance: a.balance });
    });

    const totalAssets = (grouped['asset'] || []).reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = (grouped['liability'] || []).reduce((s, a) => s + a.balance, 0);
    const totalEquity = (grouped['equity'] || []).reduce((s, a) => s + a.balance, 0);

    return NextResponse.json({
      as_of: new Date().toISOString().split('T')[0],
      total_assets: parseFloat(totalAssets.toFixed(2)),
      total_liabilities: parseFloat(totalLiabilities.toFixed(2)),
      total_equity: parseFloat(totalEquity.toFixed(2)),
      accounts_by_type: Object.entries(grouped).map(([type, accts]) => ({
        type,
        accounts: accts,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate balance sheet' }, { status: 500 });
  }
}
