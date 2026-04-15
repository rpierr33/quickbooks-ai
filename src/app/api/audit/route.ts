import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { pool } from '@/lib/db';
import { listFromStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;

    const companyId = (session?.user as any)?.companyId;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const action = searchParams.get('action');

    if (pool) {
      let baseQuery = `SELECT * FROM audit_log WHERE company_id = $1`;
      const params: unknown[] = [companyId];
      let idx = 2;

      if (action && action !== 'all') {
        baseQuery += ` AND action = $${idx++}`;
        params.push(action);
      }

      baseQuery += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
      params.push(limit, offset);

      const result = await pool.query(baseQuery, params);

      const countQuery = action && action !== 'all'
        ? `SELECT COUNT(*) FROM audit_log WHERE company_id = $1 AND action = $2`
        : `SELECT COUNT(*) FROM audit_log WHERE company_id = $1`;
      const countParams = action && action !== 'all' ? [companyId, action] : [companyId];
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

      return NextResponse.json({ entries: result.rows, total, limit, offset });
    }

    // Mock path
    let rows = await listFromStore('audit_log');
    rows = rows.filter((r) => r.company_id === companyId || !r.company_id);
    if (action && action !== 'all') {
      rows = rows.filter((r) => r.action === action);
    }
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = rows.length;
    const entries = rows.slice(offset, offset + limit);

    return NextResponse.json({ entries, total, limit, offset });
  } catch (error) {
    console.error('audit.GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
