import { NextRequest, NextResponse } from 'next/server';
import { query, listFromStore, pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(_request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    let rows: Record<string, any>[];
    if (pool) {
      const result = await query(
        'SELECT * FROM accounts WHERE company_id = $1 AND is_active = true ORDER BY type, name',
        [companyId]
      );
      rows = result.rows;
    } else {
      const all = await listFromStore('accounts');
      rows = all.filter(a => a.company_id === companyId && a.is_active !== false);
      rows.sort((a, b) => String(a.type).localeCompare(String(b.type)) || String(a.name).localeCompare(String(b.name)));
    }

    const grouped: Record<string, { name: string; balance: number }[]> = {};
    rows.forEach(a => {
      const balance = parseFloat(a.balance);
      if (!grouped[a.type]) grouped[a.type] = [];
      grouped[a.type].push({ name: a.name, balance });
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
