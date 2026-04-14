import crypto from "crypto";
import { findInStore, listFromStore, addToStore, pool, query } from "./db";

/**
 * User + password helpers. Uses Node's built-in crypto.scrypt (no bcrypt dep).
 *
 * Storage format for password_hash: "scrypt:<saltHex>:<hashHex>"
 *
 * Falls back to the in-memory mockStore when DATABASE_URL is not set. When a
 * real DATABASE_URL is configured, the corresponding `users` + `companies`
 * tables must exist — see CLAUDE.md for the DDL.
 */

const SCRYPT_KEYLEN = 32;
const SALT_BYTES = 16;

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  company_id: string;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(SALT_BYTES);
  const hash = crypto.scryptSync(plain, salt, SCRYPT_KEYLEN);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || !stored.startsWith("scrypt:")) return false;
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const candidate = crypto.scryptSync(plain, salt, expected.length);
    // constant-time compare
    return (
      expected.length === candidate.length &&
      crypto.timingSafeEqual(expected, candidate)
    );
  } catch {
    return false;
  }
}

function uuidv4(): string {
  return crypto.randomUUID();
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  if (pool) {
    const res = await query(
      "SELECT id, email, name, password_hash, company_id, is_demo, created_at, updated_at FROM users WHERE lower(email) = $1 LIMIT 1",
      [normalized]
    );
    return (res.rows[0] as UserRow) ?? null;
  }
  const row = findInStore("users", (u) => String(u.email).toLowerCase() === normalized);
  return row as UserRow | null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  if (pool) {
    const res = await query(
      "SELECT id, email, name, password_hash, company_id, is_demo, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    return (res.rows[0] as UserRow) ?? null;
  }
  const row = findInStore("users", (u) => u.id === id);
  return row as UserRow | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  companyName?: string;
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const companyName = (input.companyName ?? `${name}'s Company`).trim();

  if (!email || !name || !input.password) {
    throw new Error("email, password, and name are required");
  }
  if (input.password.length < 8) {
    throw new Error("password must be at least 8 characters");
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const now = new Date().toISOString();
  const password_hash = hashPassword(input.password);
  const company_id = uuidv4();
  const user_id = uuidv4();

  if (pool) {
    await query(
      `INSERT INTO companies (id, name, email, fiscal_year_start, coa_template, created_at, updated_at)
       VALUES ($1, $2, $3, 'january', 'standard', $4, $4)`,
      [company_id, companyName, email, now]
    );
    await query(
      `INSERT INTO users (id, email, name, password_hash, company_id, is_demo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, $6, $6)`,
      [user_id, email, name, password_hash, company_id, now]
    );
  } else {
    addToStore("companies", {
      id: company_id,
      name: companyName,
      email,
      phone: null,
      address: null,
      tax_id: null,
      industry: null,
      fiscal_year_start: "january",
      coa_template: "standard",
      onboarded_at: null,
      created_at: now,
      updated_at: now,
    });
    addToStore("users", {
      id: user_id,
      email,
      name,
      password_hash,
      company_id,
      is_demo: false,
      created_at: now,
      updated_at: now,
    });
  }

  const created = await findUserById(user_id);
  if (!created) throw new Error("failed to read back created user");
  return created;
}

export async function countUsers(): Promise<number> {
  if (pool) {
    const res = await query("SELECT COUNT(*)::int AS c FROM users", []);
    return Number(res.rows[0]?.c ?? 0);
  }
  return listFromStore("users").length;
}
