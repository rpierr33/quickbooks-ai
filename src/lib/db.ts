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

// Direct mock store access for API routes that bypass SQL
export function addToStore(table: string, record: Record<string, any>): void {
  if (pool) return; // Real DB — records are inserted via SQL
  const store = getMockStore();
  if (store[table as keyof MockStore]) {
    (store[table as keyof MockStore] as any[]).push(record);
  }
}

export function updateInStore(table: string, id: string, updates: Record<string, any>): Record<string, any> | null {
  if (pool) return null;
  const store = getMockStore();
  const rows = store[table as keyof MockStore] as any[];
  if (!rows) return null;
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...updates };
  return rows[idx];
}

export { pool };
