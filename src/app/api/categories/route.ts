import { NextResponse, NextRequest } from 'next/server';
import { query, addToStore, listFromStore, pool } from '@/lib/db';
import { requireAuth, requireWrite } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    let rows: Record<string, any>[];
    if (pool) {
      const result = await query(
        'SELECT * FROM categories WHERE company_id = $1 OR is_system = true ORDER BY name',
        [companyId]
      );
      rows = result.rows;
    } else {
      const all = await listFromStore('categories');
      rows = all.filter(c => c.company_id === companyId || c.is_system === true);
      rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;

    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const newCategory = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name,
      type,
      parent_id: null,
      icon: null,
      color: null,
      is_system: false,
      created_at: new Date().toISOString(),
    };

    await addToStore('categories', newCategory);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
