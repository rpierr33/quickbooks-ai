import { NextRequest, NextResponse } from 'next/server';
import { listFromStore, addToStore, updateInStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const rows = await listFromStore('purchase_orders');
    const po = rows.find(r => r.id === id);
    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const items = typeof po.items === 'string' ? JSON.parse(po.items) : (po.items ?? []);
    const description = `Bill from ${po.vendor_name} - ${po.po_number}`;
    const notes = `Converted from PO ${po.po_number}`;

    const transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      description,
      amount: parseFloat(po.total ?? 0),
      type: 'expense',
      account_id: null,
      category_id: null,
      is_recurring: false,
      recurring_rule_id: null,
      ai_categorized: false,
      ai_confidence: null,
      notes,
      attachments: '[]',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addToStore('transactions', transaction);

    // Mark PO as closed
    await updateInStore('purchase_orders', id, {
      status: 'closed',
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('convert-to-bill failed', error);
    return NextResponse.json({ error: 'Failed to convert to bill' }, { status: 500 });
  }
}
