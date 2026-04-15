import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore, listFromStore, pool } from '@/lib/db';
import { requireAuth, requireWrite } from '@/lib/auth-guard';

// Seed default inventory items once into the shared mock store when first accessed
let mockSeeded = false;

async function ensureMockSeeded(companyId: string) {
  if (pool || mockSeeded) return;
  mockSeeded = true;
  const existing = await listFromStore('inventory');
  const hasForCompany = existing.some((i: any) => i.company_id === companyId);
  if (hasForCompany) return;

  const items = [
    { id: crypto.randomUUID(), company_id: companyId, name: 'Design System License', sku: 'DSL-001', category: 'Digital Products', quantity: 50, unit_cost: 49.99, sale_price: 99.00, reorder_point: 10, is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: crypto.randomUUID(), company_id: companyId, name: 'Premium Support Plan', sku: 'PSP-001', category: 'Services', quantity: 999, unit_cost: 0, sale_price: 499.00, reorder_point: 0, is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: crypto.randomUUID(), company_id: companyId, name: 'Brand Guidelines Package', sku: 'BGP-001', category: 'Digital Products', quantity: 25, unit_cost: 125.00, sale_price: 299.00, reorder_point: 5, is_active: true, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
    { id: crypto.randomUUID(), company_id: companyId, name: 'UI Component Kit', sku: 'UCK-001', category: 'Digital Products', quantity: 8, unit_cost: 75.00, sale_price: 149.00, reorder_point: 10, is_active: true, created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
    { id: crypto.randomUUID(), company_id: companyId, name: 'Marketing Consultation (1hr)', sku: 'MC-001', category: 'Services', quantity: 40, unit_cost: 50.00, sale_price: 150.00, reorder_point: 5, is_active: true, created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  ];
  for (const item of items) {
    await addToStore('inventory', item);
  }
}

function enrichItem(item: Record<string, any>) {
  return {
    ...item,
    unit_cost: parseFloat(item.unit_cost) || 0,
    sale_price: parseFloat(item.sale_price) || 0,
    quantity: parseInt(item.quantity) || 0,
    reorder_point: parseInt(item.reorder_point) || 0,
    total_value: (parseFloat(item.unit_cost) || 0) * (parseInt(item.quantity) || 0),
    potential_revenue: (parseFloat(item.sale_price) || 0) * (parseInt(item.quantity) || 0),
    margin: (parseFloat(item.sale_price) || 0) > 0
      ? Math.round((((parseFloat(item.sale_price) || 0) - (parseFloat(item.unit_cost) || 0)) / (parseFloat(item.sale_price) || 0)) * 100)
      : 0,
    low_stock: (parseInt(item.reorder_point) || 0) > 0 && (parseInt(item.quantity) || 0) <= (parseInt(item.reorder_point) || 0),
  };
}

export async function GET() {
  const { unauthorized, session } = await requireAuth();
  if (unauthorized) return unauthorized;
  const companyId = (session?.user as any)?.companyId;

  if (pool) {
    const result = await query(
      'SELECT * FROM inventory WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    return NextResponse.json(result.rows.map(enrichItem));
  }

  await ensureMockSeeded(companyId);
  const all = await listFromStore('inventory');
  const items = all.filter((i: any) => i.company_id === companyId);
  return NextResponse.json(items.map(enrichItem));
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const body = await request.json();
    const { name, sku, category, quantity, unit_cost, sale_price, reorder_point } = body;
    if (!name || !sku) return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });

    const item = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name,
      sku,
      category: category || 'General',
      quantity: parseInt(quantity) || 0,
      unit_cost: parseFloat(unit_cost) || 0,
      sale_price: parseFloat(sale_price) || 0,
      reorder_point: parseInt(reorder_point) || 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (pool) {
      await query(
        `INSERT INTO inventory (id, company_id, name, sku, category, quantity, unit_cost, sale_price, reorder_point, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
        [item.id, item.company_id, item.name, item.sku, item.category, item.quantity, item.unit_cost, item.sale_price, item.reorder_point, item.is_active, item.created_at]
      );
    } else {
      await addToStore('inventory', item);
    }

    return NextResponse.json(enrichItem(item));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
