import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore, listFromStore, pool } from '@/lib/db';
import { requireAuth, requireWrite } from '@/lib/auth-guard';
import { pickAllowed } from '@/lib/validate';

const RULE_WRITE_FIELDS = ['name', 'conditions', 'category_id', 'category_name', 'is_active'] as const;

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    let rows: Record<string, any>[];
    if (pool) {
      const result = await query(
        'SELECT * FROM rules WHERE company_id = $1 ORDER BY priority DESC',
        [companyId]
      );
      rows = result.rows;
    } else {
      const all = await listFromStore('rules');
      rows = all.filter(r => r.company_id === companyId);
      rows.sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));
    }

    rows = rows.map(r => ({
      ...r,
      conditions: typeof r.conditions === 'string' ? JSON.parse(r.conditions) : r.conditions,
      actions: typeof r.actions === 'string' ? JSON.parse(r.actions) : r.actions,
    }));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const rawBody = await request.json();
    const body = pickAllowed(rawBody, RULE_WRITE_FIELDS) as Record<string, unknown>;
    const { name, conditions } = body as { name?: unknown; conditions?: unknown };

    if (!name || !conditions) {
      return NextResponse.json({ error: 'Name and conditions are required' }, { status: 400 });
    }

    const newRule = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name: String(name),
      conditions,
      actions: [],
      is_active: body.is_active != null ? Boolean(body.is_active) : true,
      priority: 0,
      created_at: new Date().toISOString(),
    };

    await addToStore('rules', newRule);
    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}
