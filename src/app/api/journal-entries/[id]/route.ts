import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore, listFromStore, pool } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

/**
 * Voiding a journal entry is the accounting-correct approach:
 * hard-deleting breaks the audit trail. We soft-delete by setting
 * status = 'voided'. The GET list in /api/journal-entries returns all
 * entries including voided ones so the UI can display them struck-through.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    const { id } = await params;

    // Verify ownership
    let existing: Record<string, any> | null = null;
    if (pool) {
      const result = await query(
        'SELECT * FROM journal_entries WHERE id = $1 AND company_id = $2',
        [id, companyId]
      );
      existing = result.rows[0] ?? null;
    } else {
      const all = await listFromStore('journal_entries');
      existing = all.find(r => r.id === id && r.company_id === companyId) ?? null;
    }

    if (!existing) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    const updates = {
      status: 'voided',
      voided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await updateInStore('journal_entries', id, updates);

    return NextResponse.json({ success: true, id, status: 'voided' });
  } catch (error) {
    console.error('journal-entries[id].DELETE failed', error);
    return NextResponse.json({ error: 'Failed to void journal entry' }, { status: 500 });
  }
}
