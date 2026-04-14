import { NextRequest, NextResponse } from 'next/server';
import { query, addToStore, listFromStore, pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

// Seed default inventory items once into the shared mock store when first accessed
let mockSeeded = false;

function ensureMockSeeded() {
  if (pool || mockSeeded) return;
  mockSeeded = true;
  const existing = listFromStore('inventory');
  if (existing.length > 0) return;

  const items = [
    { id: crypto.randomUUID(), name: 'Design System License', sku: 'DSL-001', category: 'Digital Products', quantity: 50, unit_cost: 49.99, sale_price: 99.00, reorder_point: 10, is_active: true, created_at: '2026-01-15T00:00:00Z' },
    { id: crypto.randomUUID(), name: 'Premium Support Plan', sku: 'PSP-001', category: 'Services', quantity: 999, unit_cost: 0, sale_price: 499.00, reorder_point: 0, is_active: true, created_at: '2026-01-15T00:00:00Z' },
    { id: crypto.randomUUID(), name: 'Brand Guidelines Package', sku: 'BGP-001', category: 'Digital Products', quantity: 25, unit_cost: 125.00, sale_price: 299.00, reorder_point: 5, is_active: true, created_at: '2026-02-01T00:00:00Z' },
    { id: crypto.randomUUID(), name: 'UI Component Kit', sku: 'UCK-001', category: 'Digital Products', quantity: 8, unit_cost: 75.00, sale_price: 149.00, reorder_point: 10, is_active: true, created_at: '2026-02-10T00:00:00Z' },
    { id: crypto.randomUUID(), name: 'Marketing Consultation (1hr)', sku: 'MC-001', category: 'Services', quantity: 40, unit_cost: 50.00, sale_price: 150.00, reorder_point: 5, is_active: true, created_at: '2026-03-01T00:00:00Z' },
  ];
  for (const item of items) {
    addToStore('inventory', item);
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
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  if (pool) {
    const result = await query('SELECT * FROM inventory ORDER BY created_at DESC');
    return NextResponse.json(result.rows.map(enrichItem));
  }

  ensureMockSeeded();
  const items = listFromStore('inventory');
  return NextResponse.json(items.map(enrichItem));
}

export async function POST(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const { name, sku, category, quantity, unit_cost, sale_price, reorder_point } = body;
    if (!name || !sku) return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });

    const item = {
      id: crypto.randomUUID(),
      name,
      sku,
      category: category || 'General',
      quantity: parseInt(quantity) || 0,
      unit_cost: parseFloat(unit_cost) || 0,
      sale_price: parseFloat(sale_price) || 0,
      reorder_point: parseInt(reorder_point) || 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (pool) {
      await query(
        `INSERT INTO inventory (id, name, sku, category, quantity, unit_cost, sale_price, reorder_point, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [item.id, item.name, item.sku, item.category, item.quantity, item.unit_cost, item.sale_price, item.reorder_point, item.is_active, item.created_at]
      );
    } else {
      addToStore('inventory', item);
    }

    return NextResponse.json(enrichItem(item));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
