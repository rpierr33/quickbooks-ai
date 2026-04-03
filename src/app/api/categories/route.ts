import { NextResponse, NextRequest } from 'next/server';
import { query, addToStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const result = await query('SELECT * FROM categories ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized: unauth } = await requireAuth();
    if (unauth) return unauth;
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const newCategory = {
      id: crypto.randomUUID(),
      name,
      type,
      parent_id: null,
      icon: null,
      color: null,
      is_system: false,
      created_at: new Date().toISOString(),
    };

    addToStore('categories', newCategory);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
