import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore, listFromStore, pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import {
  asRecord,
  getString,
  getNumber,
  pickAllowed,
  ValidationError,
} from '@/lib/validate';

// Mass-assignment allowlist — see CLAUDE.md §Hard rules
const BUDGET_WRITE_FIELDS = [
  'category_id',
  'category_name',
  'monthly_amount',
  'period',
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;

    const body = asRecord(await request.json());
    const allowed = pickAllowed(body, BUDGET_WRITE_FIELDS);

    const patch: Record<string, unknown> = {};
    if ('category_id' in allowed) patch.category_id = getString(body, 'category_id', { required: true, max: 64 });
    if ('category_name' in allowed) patch.category_name = getString(body, 'category_name', { required: true, max: 200 });
    if ('monthly_amount' in allowed) patch.monthly_amount = getNumber(body, 'monthly_amount', { required: true, min: 0 });
    if ('period' in allowed) patch.period = getString(body, 'period', { required: true, max: 10 });

    // Verify ownership
    let existing: Record<string, any> | null = null;
    if (pool) {
      const result = await query(
        'SELECT * FROM budgets WHERE id = $1 AND company_id = $2',
        [id, companyId]
      );
      existing = result.rows[0] ?? null;
    } else {
      const all = await listFromStore('budgets');
      existing = all.find(r => r.id === id && r.company_id === companyId) ?? null;
    }
    if (!existing) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    const updates = { ...patch, updated_at: new Date().toISOString() };
    await updateInStore('budgets', id, updates);
    const updated = {
      ...existing,
      ...updates,
      monthly_amount: parseFloat(String(patch.monthly_amount ?? existing.monthly_amount)),
    };
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('budgets[id].PUT failed', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;

    if (pool) {
      const result = await query(
        'DELETE FROM budgets WHERE id = $1 AND company_id = $2',
        [id, companyId]
      );
      if ((result as any).rowCount === 0) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
      }
    } else {
      const all = await listFromStore('budgets');
      const existing = all.find(r => r.id === id && r.company_id === companyId);
      if (!existing) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
      }
      await query('DELETE FROM budgets WHERE id = $1', [id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('budgets[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}
