import { NextRequest, NextResponse } from 'next/server';
import { query, updateInStore } from '@/lib/db';
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
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { id } = await params;

    const result = await query('SELECT * FROM journal_entries WHERE id = $1', [id]);
    if (result.rows.length === 0) {
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
