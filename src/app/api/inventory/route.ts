import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

// Seed inventory items in mock store
const mockInventory = [
  { id: crypto.randomUUID(), name: 'Design System License', sku: 'DSL-001', category: 'Digital Products', quantity: 50, unit_cost: 49.99, sale_price: 99.00, reorder_point: 10, is_active: true, created_at: '2026-01-15T00:00:00Z' },
  { id: crypto.randomUUID(), name: 'Premium Support Plan', sku: 'PSP-001', category: 'Services', quantity: 999, unit_cost: 0, sale_price: 499.00, reorder_point: 0, is_active: true, created_at: '2026-01-15T00:00:00Z' },
  { id: crypto.randomUUID(), name: 'Brand Guidelines Package', sku: 'BGP-001', category: 'Digital Products', quantity: 25, unit_cost: 125.00, sale_price: 299.00, reorder_point: 5, is_active: true, created_at: '2026-02-01T00:00:00Z' },
  { id: crypto.randomUUID(), name: 'UI Component Kit', sku: 'UCK-001', category: 'Digital Products', quantity: 8, unit_cost: 75.00, sale_price: 149.00, reorder_point: 10, is_active: true, created_at: '2026-02-10T00:00:00Z' },
  { id: crypto.randomUUID(), name: 'Marketing Consultation (1hr)', sku: 'MC-001', category: 'Services', quantity: 40, unit_cost: 50.00, sale_price: 150.00, reorder_point: 5, is_active: true, created_at: '2026-03-01T00:00:00Z' },
];

export async function GET() {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;
  return NextResponse.json(mockInventory.map(item => ({
    ...item,
    total_value: item.quantity * item.unit_cost,
    potential_revenue: item.quantity * item.sale_price,
    margin: item.sale_price > 0 ? Math.round(((item.sale_price - item.unit_cost) / item.sale_price) * 100) : 0,
    low_stock: item.reorder_point > 0 && item.quantity <= item.reorder_point,
  })));
}

export async function POST(request: Request) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const { name, sku, category, quantity, unit_cost, sale_price, reorder_point } = body;
    if (!name || !sku) return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });

    const item = {
      id: crypto.randomUUID(),
      name, sku,
      category: category || 'General',
      quantity: parseInt(quantity) || 0,
      unit_cost: parseFloat(unit_cost) || 0,
      sale_price: parseFloat(sale_price) || 0,
      reorder_point: parseInt(reorder_point) || 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    mockInventory.push(item);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
