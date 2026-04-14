import { Pool } from 'pg';

const isRealDb = process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('user:password@localhost');

let pool: Pool | null = null;

if (isRealDb) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  });
}

// In-memory mock store for development without PostgreSQL
interface MockStore {
  accounts: Record<string, any>[];
  categories: Record<string, any>[];
  transactions: Record<string, any>[];
  invoices: Record<string, any>[];
  estimates: Record<string, any>[];
  insights: Record<string, any>[];
  rules: Record<string, any>[];
  recurring_transactions: Record<string, any>[];
  ai_cache: Record<string, any>[];
  budgets: Record<string, any>[];
  scanned_receipts: Record<string, any>[];
  journal_entries: Record<string, any>[];
  clients: Record<string, any>[];
  inventory: Record<string, any>[];
  users: Record<string, any>[];
  companies: Record<string, any>[];
  mileage: Record<string, any>[];
  time_entries: Record<string, any>[];
  purchase_orders: Record<string, any>[];
  employees: Record<string, any>[];
  payroll_runs: Record<string, any>[];
  contractors: Record<string, any>[];
  projects: Record<string, any>[];
  bills: Record<string, any>[];
  invite_tokens: Record<string, any>[];
}

let mockStore: MockStore | null = null;

function getMockStore(): MockStore {
  if (!mockStore) {
    // Initialize with seed data
    const { seedMockStore } = require('./seed');
    mockStore = seedMockStore();
  }
  return mockStore!;
}

export async function query(text: string, params?: any[]): Promise<{ rows: any[] }> {
  if (pool) {
    const result = await pool.query(text, params);
    return { rows: result.rows };
  }

  // Mock query parser - handles basic SQL patterns
  return mockQuery(text, params);
}

function mockQuery(sql: string, params?: any[]): { rows: any[] } {
  const store = getMockStore();
  const sqlLower = sql.toLowerCase().trim();

  // SELECT queries
  if (sqlLower.startsWith('select')) {
    // Dashboard stats
    if (sqlLower.includes('sum') && sqlLower.includes('transactions')) {
      if (sqlLower.includes("type = 'income'") || (params && params.includes('income'))) {
        const total = store.transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return { rows: [{ total: total.toString() }] };
      }
      if (sqlLower.includes("type = 'expense'") || (params && params.includes('expense'))) {
        const total = store.transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return { rows: [{ total: total.toString() }] };
      }
    }

    // Determine table
    let table = '';
    if (sqlLower.includes('from transactions') || sqlLower.includes('from "transactions"')) table = 'transactions';
    else if (sqlLower.includes('from accounts')) table = 'accounts';
    else if (sqlLower.includes('from categories')) table = 'categories';
    else if (sqlLower.includes('from invoices')) table = 'invoices';
    else if (sqlLower.includes('from estimates')) table = 'estimates';
    else if (sqlLower.includes('from insights')) table = 'insights';
    else if (sqlLower.includes('from rules')) table = 'rules';
    else if (sqlLower.includes('from recurring_transactions')) table = 'recurring_transactions';
    else if (sqlLower.includes('from ai_cache')) table = 'ai_cache';
    else if (sqlLower.includes('from budgets')) table = 'budgets';
    else if (sqlLower.includes('from scanned_receipts')) table = 'scanned_receipts';
    else if (sqlLower.includes('from journal_entries')) table = 'journal_entries';
    else if (sqlLower.includes('from bills')) table = 'bills';
    else if (sqlLower.includes('from mileage')) table = 'mileage';
    else if (sqlLower.includes('from time_entries')) table = 'time_entries';
    else if (sqlLower.includes('from purchase_orders')) table = 'purchase_orders';

    if (!table) return { rows: [] };

    let rows = [...(store[table as keyof MockStore] || [])];

    // Handle WHERE id = $1
    if (params && params.length > 0 && sqlLower.includes('where') && sqlLower.includes('id')) {
      rows = rows.filter(r => r.id === params[0]);
    }

    // Handle ORDER BY date DESC or created_at DESC
    if (sqlLower.includes('order by')) {
      if (sqlLower.includes('date desc') || sqlLower.includes('created_at desc')) {
        rows.sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
      }
    }

    // Handle LIMIT
    const limitMatch = sqlLower.match(/limit\s+(\d+)/);
    if (limitMatch) {
      rows = rows.slice(0, parseInt(limitMatch[1]));
    }

    return { rows };
  }

  // INSERT
  if (sqlLower.startsWith('insert')) {
    let table = '';
    const tableMatch = sqlLower.match(/insert\s+into\s+(\w+)/);
    if (tableMatch) table = tableMatch[1];

    if (table && store[table as keyof MockStore]) {
      // Build object from params - this is simplified
      const newRow = params ? { id: crypto.randomUUID(), ...Object.fromEntries(
        (params || []).map((v, i) => [`param_${i}`, v])
      )} : { id: crypto.randomUUID() };
      (store[table as keyof MockStore] as any[]).push(newRow);
      return { rows: [newRow] };
    }
    return { rows: [] };
  }

  // UPDATE
  if (sqlLower.startsWith('update')) {
    let table = '';
    const tableMatch = sqlLower.match(/update\s+(\w+)/);
    if (tableMatch) table = tableMatch[1];

    if (table && store[table as keyof MockStore] && params) {
      const id = params[params.length - 1]; // ID is usually last param
      const rows = store[table as keyof MockStore] as any[];
      const idx = rows.findIndex(r => r.id === id);
      if (idx !== -1) {
        return { rows: [rows[idx]] };
      }
    }
    return { rows: [] };
  }

  // DELETE
  if (sqlLower.startsWith('delete')) {
    let table = '';
    const tableMatch = sqlLower.match(/delete\s+from\s+(\w+)/);
    if (tableMatch) table = tableMatch[1];

    if (table && store[table as keyof MockStore] && params) {
      const rows = store[table as keyof MockStore] as any[];
      const idx = rows.findIndex(r => r.id === params[0]);
      if (idx !== -1) {
        const deleted = rows.splice(idx, 1);
        return { rows: deleted };
      }
    }
    return { rows: [] };
  }

  return { rows: [] };
}

// Direct mock store access for API routes that bypass SQL.
// All functions are async — callers must await them.

export async function addToStore(table: string, record: Record<string, any>): Promise<void> {
  if (pool) {
    const keys = Object.keys(record).filter(k => record[k] !== undefined);
    const values = keys.map(k => record[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');
    await pool.query(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
      values.map(v => (typeof v === 'object' && v !== null && !Array.isArray(v)) ? JSON.stringify(v) : (Array.isArray(v) ? JSON.stringify(v) : v))
    );
    return;
  }
  const store = getMockStore();
  if (store[table as keyof MockStore]) {
    (store[table as keyof MockStore] as any[]).push(record);
  }
}

export async function updateInStore(table: string, id: string, updates: Record<string, any>): Promise<Record<string, any> | null> {
  if (pool) {
    const keys = Object.keys(updates).filter(k => updates[k] !== undefined);
    if (keys.length === 0) return null;
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...keys.map(k => {
      const v = updates[k];
      return (typeof v === 'object' && v !== null && !Array.isArray(v)) ? JSON.stringify(v) : (Array.isArray(v) ? JSON.stringify(v) : v);
    })];
    const result = await pool.query(
      `UPDATE ${table} SET ${sets} WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  }
  const store = getMockStore();
  const rows = store[table as keyof MockStore] as any[];
  if (!rows) return null;
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...updates };
  return rows[idx];
}

// Read-only accessor for API routes that filter in memory.
export async function listFromStore(table: string): Promise<Record<string, any>[]> {
  if (pool) {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    return result.rows;
  }
  const store = getMockStore();
  return (store[table as keyof MockStore] as any[]) ?? [];
}

export async function deleteFromStore(table: string, id: string): Promise<boolean> {
  if (pool) {
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
    return result.rows.length > 0;
  }
  const store = getMockStore();
  const rows = store[table as keyof MockStore] as any[];
  if (!rows) return false;
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);
  return true;
}

export async function findInStore(table: string, predicate: (row: any) => boolean): Promise<Record<string, any> | null> {
  const rows = await listFromStore(table);
  return rows.find(predicate) ?? null;
}

export { pool };
