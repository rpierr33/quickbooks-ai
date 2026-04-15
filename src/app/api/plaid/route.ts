import { NextRequest, NextResponse } from 'next/server';
import { query, pool, addToStore, updateInStore, listFromStore } from '@/lib/db';
import {
  isConfigured,
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
  getAccounts,
} from '@/lib/plaid';
import type { PlaidTransaction } from '@/lib/plaid';
import { categorizeTransaction } from '@/lib/ai';
import { applyRules } from '@/lib/rules-engine';
import { requireAuth } from '@/lib/auth-guard';

// ── Helpers ──

/** Map a Plaid transaction to the Ledgr transaction shape and persist it. */
async function createTransactionFromPlaid(
  plaidTxn: PlaidTransaction,
  accountId: string | null
): Promise<Record<string, unknown>> {
  // Plaid amounts: positive = money leaving account (expense), negative = money entering (income)
  const amount = Math.abs(plaidTxn.amount);
  const type = plaidTxn.amount > 0 ? 'expense' : 'income';
  const description =
    plaidTxn.merchant_name || plaidTxn.name || 'Bank transaction';

  // Try rules engine first for category
  let finalCategoryId: string | null = null;
  let aiCategorized = false;
  let aiConfidence: number | null = null;

  const ruleResult = await applyRules(description, amount, type);
  if (ruleResult.matched) {
    const setCategoryAction = ruleResult.actions.find(
      (a: { action: string; value?: string }) => a.action === 'set_category'
    );
    if (setCategoryAction) {
      finalCategoryId = setCategoryAction.value ?? null;
    }
  }

  // Fall back to AI categorization
  if (!finalCategoryId) {
    const aiResult = await categorizeTransaction(description, amount);
    const categories = await query('SELECT * FROM categories');
    const matchedCat = categories.rows.find(
      (c) => c.name.toLowerCase() === aiResult.category.toLowerCase()
    );
    if (matchedCat) {
      finalCategoryId = matchedCat.id;
      aiCategorized = true;
      aiConfidence = aiResult.confidence;
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newTransaction = {
    id,
    date: plaidTxn.date,
    description,
    amount,
    type,
    account_id: accountId,
    category_id: finalCategoryId,
    is_recurring: false,
    recurring_rule_id: null,
    ai_categorized: aiCategorized,
    ai_confidence: aiConfidence,
    plaid_transaction_id: plaidTxn.transaction_id,
    notes: plaidTxn.pending ? 'Pending transaction' : null,
    attachments: [],
    created_at: now,
    updated_at: now,
  };

  // Persist via the mock/real DB layer
  try {
    await query(
      `INSERT INTO transactions (id, date, description, amount, type, account_id, category_id,
        is_recurring, recurring_rule_id, ai_categorized, ai_confidence, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        id,
        plaidTxn.date,
        description,
        amount,
        type,
        accountId,
        finalCategoryId,
        false,
        null,
        aiCategorized,
        aiConfidence,
        newTransaction.notes,
        now,
        now,
      ]
    );
  } catch {
    // Mock DB may not handle the full INSERT; the object is still returned
  }

  return newTransaction;
}

// ── DB helpers for plaid_connections ──

interface PlaidConnectionRow {
  id: string;
  company_id: string | null;
  institution_name: string | null;
  institution_id: string | null;
  // NOTE: access_token stored as plaintext for MVP.
  // TODO: encrypt at rest before production — use AES-256-GCM with a KMS-managed key.
  access_token: string;
  item_id: string | null;
  cursor: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

async function dbInsertConnection(row: Omit<PlaidConnectionRow, 'created_at' | 'updated_at'>): Promise<PlaidConnectionRow> {
  const now = new Date().toISOString();
  if (pool) {
    const res = await pool.query(
      `INSERT INTO plaid_connections (id, company_id, institution_name, institution_id, access_token, item_id, cursor, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING *`,
      [row.id, row.company_id, row.institution_name, row.institution_id, row.access_token, row.item_id, row.cursor, row.status, now]
    );
    return res.rows[0] as PlaidConnectionRow;
  }
  const record = { ...row, created_at: now, updated_at: now };
  await addToStore('plaid_connections', record);
  return record;
}

async function dbGetConnectionById(id: string, companyId: string | null): Promise<PlaidConnectionRow | null> {
  if (pool) {
    const res = await pool.query(
      `SELECT * FROM plaid_connections WHERE id = $1 AND status = 'active'`,
      [id]
    );
    return (res.rows[0] as PlaidConnectionRow) ?? null;
  }
  const rows = await listFromStore('plaid_connections') as PlaidConnectionRow[];
  return rows.find((r) => r.id === id && r.status === 'active') ?? null;
}

async function dbListConnections(companyId: string | null): Promise<PlaidConnectionRow[]> {
  if (pool) {
    if (companyId) {
      const res = await pool.query(
        `SELECT * FROM plaid_connections WHERE company_id = $1 AND status = 'active' ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows as PlaidConnectionRow[];
    }
    const res = await pool.query(`SELECT * FROM plaid_connections WHERE status = 'active' ORDER BY created_at DESC`);
    return res.rows as PlaidConnectionRow[];
  }
  const rows = await listFromStore('plaid_connections') as PlaidConnectionRow[];
  return rows.filter((r) => r.status === 'active' && (!companyId || r.company_id === companyId));
}

async function dbUpdateCursor(id: string, cursor: string): Promise<void> {
  const now = new Date().toISOString();
  if (pool) {
    await pool.query(
      `UPDATE plaid_connections SET cursor = $1, updated_at = $2 WHERE id = $3`,
      [cursor, now, id]
    );
    return;
  }
  await updateInStore('plaid_connections', id, { cursor, updated_at: now });
}

async function dbDisconnect(id: string, companyId: string | null): Promise<void> {
  const now = new Date().toISOString();
  if (pool) {
    await pool.query(
      `UPDATE plaid_connections SET status = 'disconnected', updated_at = $1 WHERE id = $2`,
      [now, id]
    );
    return;
  }
  await updateInStore('plaid_connections', id, { status: 'disconnected', updated_at: now });
}

// ── Route handlers ──

export async function POST(request: NextRequest) {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  // Gate: Plaid must be configured
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: 'Plaid not configured',
        setup:
          'Set PLAID_CLIENT_ID and PLAID_SECRET environment variables',
      },
      { status: 503 }
    );
  }

  // Extract company_id from session (may be absent on old JWT tokens)
  const companyId = (session?.user as { companyId?: string })?.companyId ?? null;

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ── Create Link Token ──
      case 'create_link_token': {
        const userId = body.user_id || (session?.user as { id?: string })?.id || 'default-user';
        const result = await createLinkToken(userId);
        return NextResponse.json({
          link_token: result.link_token,
          expiration: result.expiration,
        });
      }

      // ── Exchange Public Token ──
      case 'exchange_token': {
        const { public_token, institution_name, institution_id } = body;
        if (!public_token) {
          return NextResponse.json(
            { error: 'Missing public_token' },
            { status: 400 }
          );
        }

        const exchangeResult = await exchangePublicToken(public_token);

        // Persist connection to database
        const connectionId = crypto.randomUUID();
        await dbInsertConnection({
          id: connectionId,
          company_id: companyId,
          institution_name: institution_name ?? null,
          institution_id: institution_id ?? null,
          access_token: exchangeResult.access_token,
          item_id: exchangeResult.item_id,
          cursor: null,
          status: 'active',
        });

        // Fetch linked accounts
        const accountsResult = await getAccounts(exchangeResult.access_token);

        return NextResponse.json({
          connection_id: connectionId,
          item_id: exchangeResult.item_id,
          accounts: accountsResult.accounts,
        });
      }

      // ── Sync Transactions ──
      case 'sync': {
        const { connection_id } = body;
        if (!connection_id) {
          return NextResponse.json(
            { error: 'Missing connection_id' },
            { status: 400 }
          );
        }

        const connection = await dbGetConnectionById(connection_id, companyId);
        if (!connection) {
          return NextResponse.json(
            { error: 'Unknown connection_id. Re-link your bank account.' },
            { status: 404 }
          );
        }

        const syncResult = await syncTransactions(
          connection.access_token,
          connection.cursor ?? undefined
        );

        // Update cursor in DB for next incremental sync
        await dbUpdateCursor(connection_id, syncResult.next_cursor);

        // Create Ledgr transactions for each new Plaid transaction
        const created: Record<string, unknown>[] = [];
        for (const txn of syncResult.added) {
          const ledgrTxn = await createTransactionFromPlaid(txn, null);
          created.push(ledgrTxn);
        }

        return NextResponse.json({
          added: created.length,
          modified: syncResult.modified.length,
          removed: syncResult.removed.length,
          next_cursor: syncResult.next_cursor,
          transactions: created,
        });
      }

      // ── Disconnect ──
      case 'disconnect': {
        const { connection_id } = body;
        if (!connection_id) {
          return NextResponse.json({ error: 'Missing connection_id' }, { status: 400 });
        }
        await dbDisconnect(connection_id, companyId);
        return NextResponse.json({ success: true });
      }

      // ── List Connections ──
      case 'list_connections': {
        const connections = await dbListConnections(companyId);
        return NextResponse.json({
          connections: connections.map((conn) => ({
            connection_id: conn.id,
            item_id: conn.item_id,
            institution_name: conn.institution_name,
            connected_at: conn.created_at,
            has_cursor: Boolean(conn.cursor),
          })),
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}`,
            valid_actions: [
              'create_link_token',
              'exchange_token',
              'sync',
              'disconnect',
              'list_connections',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    console.error('Plaid API error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { session, unauthorized: unauth } = await requireAuth();
  if (unauth) return unauth;

  const companyId = (session?.user as { companyId?: string })?.companyId ?? null;
  const connections = await dbListConnections(companyId);

  return NextResponse.json({
    configured: isConfigured(),
    environment:
      process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    connections: connections.length,
  });
}
