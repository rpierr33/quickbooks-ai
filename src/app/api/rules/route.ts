import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const result = await query('SELECT * FROM rules ORDER BY priority DESC');
    const rows = result.rows.map(r => ({
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
    const { unauthorized: unauth } = await requireAuth();
    if (unauth) return unauth;
    const body = await request.json();
    const { name, conditions, actions } = body;

    if (!name || !conditions || !actions) {
      return NextResponse.json({ error: 'Name, conditions, and actions are required' }, { status: 400 });
    }

    const newRule = {
      id: crypto.randomUUID(),
      name,
      conditions,
      actions,
      is_active: true,
      priority: 0,
      created_at: new Date().toISOString(),
    };

    addToStore('rules', newRule);
    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}
