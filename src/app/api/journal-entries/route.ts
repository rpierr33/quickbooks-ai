import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore, listFromStore, pool } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    let rows: Record<string, any>[];
    if (pool) {
      const result = await query(
        'SELECT * FROM journal_entries WHERE company_id = $1 ORDER BY created_at DESC',
        [companyId]
      );
      rows = result.rows;
    } else {
      const all = await listFromStore('journal_entries');
      rows = all.filter(r => r.company_id === companyId);
      rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Journal entries GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Accountants can write journal entries; viewers cannot
    const { unauthorized, session } = await requirePermission('write_journal_entries');
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const body = await request.json();
    const { date, memo, lines } = body;

    if (!memo || !lines || lines.length < 2) {
      return NextResponse.json({ error: 'Memo and at least 2 lines are required' }, { status: 400 });
    }

    const totalDebits = lines.reduce((s: number, l: any) => s + (parseFloat(l.debit) || 0), 0);
    const totalCredits = lines.reduce((s: number, l: any) => s + (parseFloat(l.credit) || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json({ error: 'Debits must equal credits' }, { status: 400 });
    }

    const entry = {
      id: crypto.randomUUID(),
      company_id: companyId,
      date: date || new Date().toISOString().split('T')[0],
      memo,
      lines,
      created_at: new Date().toISOString(),
    };

    await addToStore('journal_entries', entry);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Journal entries POST error:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
