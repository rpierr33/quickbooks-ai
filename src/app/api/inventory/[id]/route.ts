import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore, listFromStore, pool } from '@/lib/db';
import { requireWrite } from '@/lib/auth-guard';
import { pickAllowed } from '@/lib/validate';

const INVENTORY_WRITE_FIELDS = ['name', 'sku', 'description', 'quantity', 'unit_price', 'cost_price', 'unit_cost', 'sale_price', 'reorder_point', 'category', 'is_active'] as const;

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;
    const rawBody = await request.json();
    const body = pickAllowed(rawBody, INVENTORY_WRITE_FIELDS) as Record<string, unknown>;
    const { name, sku, category, quantity, unit_cost, sale_price, reorder_point } = body as Record<string, unknown>;

    if (pool) {
      const result = await query(
        `UPDATE inventory
         SET name=$1, sku=$2, category=$3, quantity=$4, unit_cost=$5, sale_price=$6, reorder_point=$7, updated_at=NOW()
         WHERE id=$8 AND company_id=$9
         RETURNING *`,
        [name, sku, category, parseInt(String(quantity)) || 0, parseFloat(String(unit_cost)) || 0, parseFloat(String(sale_price)) || 0, parseInt(String(reorder_point)) || 0, id, companyId]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      return NextResponse.json(enrichItem(result.rows[0]));
    }

    // Mock store fallback
    const all = await listFromStore('inventory');
    const existing = all.find((i: any) => i.id === id && i.company_id === companyId);
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const updated = {
      ...existing,
      name: name ?? existing.name,
      sku: sku ?? existing.sku,
      category: category ?? existing.category,
      quantity: parseInt(String(quantity)) || existing.quantity,
      unit_cost: parseFloat(String(unit_cost)) || existing.unit_cost,
      sale_price: parseFloat(String(sale_price)) || existing.sale_price,
      reorder_point: parseInt(String(reorder_point)) || existing.reorder_point,
      updated_at: new Date().toISOString(),
    };
    await updateInStore('inventory', id, updated);
    return NextResponse.json(enrichItem(updated));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { unauthorized, session } = await requireWrite();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;

    if (pool) {
      await query('DELETE FROM inventory WHERE id=$1 AND company_id=$2', [id, companyId]);
      return NextResponse.json({ ok: true });
    }

    const all = await listFromStore('inventory');
    const existing = all.find((i: any) => i.id === id && i.company_id === companyId);
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    await updateInStore('inventory', id, { ...existing, is_active: false });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
