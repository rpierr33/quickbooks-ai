import { NextResponse } from 'next/server';
import { query, addToStore, updateInStore, listFromStore, pool } from '@/lib/db';
import { requireWrite } from '@/lib/auth-guard';

/**
 * Calculate the next run date for a recurring transaction based on its frequency.
 */
function getNextDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

/**
 * GET /api/recurring/execute
 *
 * Executes all active recurring transactions whose next_run date is today or earlier.
 * Idempotent — skips transactions that already have a transaction with the same
 * description on the same date to prevent duplicates on repeated calls.
 *
 * Returns: { executed: number, skipped: number, nextRun: Array<{ description, next_run }> }
 */
export async function GET() {
  try {
    const { unauthorized } = await requireWrite();
    if (unauthorized) return unauthorized;

    const today = new Date().toISOString().split('T')[0];

    // Fetch all active recurring transactions that are due
    let dueRecurring: Array<Record<string, any>>;
    if (pool) {
      const result = await query(
        `SELECT * FROM recurring_transactions
         WHERE is_active = true AND next_run <= $1
         ORDER BY next_run ASC`,
        [today]
      );
      dueRecurring = result.rows;
    } else {
      const all = await listFromStore('recurring_transactions');
      dueRecurring = all.filter(
        (r) => r.is_active === true && r.next_run <= today
      );
    }

    if (dueRecurring.length === 0) {
      return NextResponse.json({ executed: 0, skipped: 0, nextRun: [] });
    }

    // Fetch existing transactions to check for duplicates
    let existingTransactions: Array<Record<string, any>>;
    if (pool) {
      const result = await query('SELECT description, date FROM transactions');
      existingTransactions = result.rows;
    } else {
      existingTransactions = await listFromStore('transactions');
    }

    // Build a Set of "description|date" for O(1) duplicate checks
    const existingKeys = new Set<string>(
      existingTransactions.map((t) => `${t.description}|${t.date}`)
    );

    let executed = 0;
    let skipped = 0;
    const nextRunList: Array<{ description: string; next_run: string }> = [];

    for (const recurring of dueRecurring) {
      const runDate = recurring.next_run?.split('T')[0] ?? today;
      const dedupeKey = `${recurring.description}|${runDate}`;

      if (existingKeys.has(dedupeKey)) {
        // Already executed for this date — advance the date but don't create another transaction
        skipped++;
      } else {
        // Create the real transaction
        const transaction = {
          id: crypto.randomUUID(),
          date: runDate,
          description: recurring.description,
          amount: parseFloat(String(recurring.amount)),
          type: recurring.type ?? 'expense',
          account_id: recurring.account_id ?? null,
          category_id: recurring.category_id ?? null,
          category_name: recurring.category ?? null,
          account_name: null,
          is_recurring: true,
          recurring_rule_id: recurring.id,
          ai_categorized: false,
          ai_confidence: null,
          notes: `Auto-created from recurring: ${recurring.description}`,
          attachments: '[]',
          currency: 'USD',
          exchange_rate: 1,
          base_amount: parseFloat(String(recurring.amount)),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await addToStore('transactions', transaction);
        existingKeys.add(dedupeKey);
        executed++;
      }

      // Advance next_run regardless of whether we created or skipped
      const nextDate = getNextDate(new Date(runDate), recurring.frequency ?? 'monthly');
      const nextRunStr = nextDate.toISOString().split('T')[0];

      await updateInStore('recurring_transactions', recurring.id, {
        next_run: nextRunStr,
        last_run: runDate,
        updated_at: new Date().toISOString(),
      });

      nextRunList.push({ description: recurring.description, next_run: nextRunStr });
    }

    return NextResponse.json({ executed, skipped, nextRun: nextRunList });
  } catch (error) {
    console.error('recurring/execute failed:', error);
    return NextResponse.json(
      { error: 'Failed to execute recurring transactions' },
      { status: 500 }
    );
  }
}
