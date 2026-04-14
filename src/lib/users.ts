import crypto from "crypto";
import { findInStore, listFromStore, addToStore, updateInStore, pool, query } from "./db";
import type { UserRole } from "./roles";

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
  role: UserRole;
  status: "active" | "pending";
  invite_token?: string | null;
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

/** Normalize raw DB/store row — backfill missing role/status for pre-migration rows. */
function normalizeUserRow(row: Record<string, unknown>): UserRow {
  return {
    ...(row as unknown as UserRow),
    role: ((row.role as UserRole) ?? "owner") as UserRole,
    status: ((row.status as "active" | "pending") ?? "active") as
      | "active"
      | "pending",
    invite_token: (row.invite_token as string | null) ?? null,
  };
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  if (pool) {
    const res = await query(
      "SELECT id, email, name, password_hash, company_id, role, status, invite_token, is_demo, created_at, updated_at FROM users WHERE lower(email) = $1 LIMIT 1",
      [normalized]
    );
    const row = res.rows[0];
    if (!row) return null;
    return normalizeUserRow(row);
  }
  const row = await findInStore(
    "users",
    (u) => String(u.email).toLowerCase() === normalized
  );
  return row ? normalizeUserRow(row) : null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  if (pool) {
    const res = await query(
      "SELECT id, email, name, password_hash, company_id, role, status, invite_token, is_demo, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    const row = res.rows[0];
    if (!row) return null;
    return normalizeUserRow(row);
  }
  const row = await findInStore("users", (u) => u.id === id);
  return row ? normalizeUserRow(row) : null;
}

export async function findUserByInviteToken(
  token: string
): Promise<UserRow | null> {
  if (pool) {
    const res = await query(
      "SELECT id, email, name, password_hash, company_id, role, status, invite_token, is_demo, created_at, updated_at FROM users WHERE invite_token = $1 LIMIT 1",
      [token]
    );
    const row = res.rows[0];
    if (!row) return null;
    return normalizeUserRow(row);
  }
  const row = await findInStore("users", (u) => u.invite_token === token);
  return row ? normalizeUserRow(row) : null;
}

/** List all users belonging to a company. */
export async function listUsersByCompany(
  companyId: string
): Promise<UserRow[]> {
  if (pool) {
    const res = await query(
      "SELECT id, email, name, password_hash, company_id, role, status, invite_token, is_demo, created_at, updated_at FROM users WHERE company_id = $1 ORDER BY created_at ASC",
      [companyId]
    );
    return res.rows.map(normalizeUserRow);
  }
  const allRows = await listFromStore("users");
  const rows = allRows.filter((u) => u.company_id === companyId);
  return rows.map(normalizeUserRow);
}

/** Update a user's role. */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<UserRow | null> {
  const now = new Date().toISOString();
  if (pool) {
    const res = await query(
      "UPDATE users SET role = $1, updated_at = $2 WHERE id = $3 RETURNING id, email, name, password_hash, company_id, role, status, invite_token, is_demo, created_at, updated_at",
      [role, now, userId]
    );
    const row = res.rows[0];
    return row ? normalizeUserRow(row) : null;
  }
  const updated = await updateInStore("users", userId, { role, updated_at: now });
  return updated ? normalizeUserRow(updated) : null;
}

/** Remove a user from the company. */
export async function removeUserFromCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  if (pool) {
    const res = await query(
      "DELETE FROM users WHERE id = $1 AND company_id = $2 RETURNING id",
      [userId, companyId]
    );
    return res.rows.length > 0;
  }
  const rows = (await listFromStore("users")) as UserRow[];
  const idx = rows.findIndex(
    (u) => u.id === userId && u.company_id === companyId
  );
  if (idx === -1) return false;
  rows.splice(idx, 1);
  return true;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  companyName?: string;
  /** Join an existing company instead of creating a new one. */
  existingCompanyId?: string;
  /** Role to assign. Defaults to 'owner' for new company, 'viewer' for invited. */
  role?: UserRole;
  /** Defaults to 'active'. */
  status?: "active" | "pending";
  /** Invite token — cleared after acceptance. */
  inviteToken?: string | null;
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

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
  const user_id = uuidv4();
  const status = input.status ?? "active";
  const invite_token = input.inviteToken ?? null;

  let company_id: string;
  let role: UserRole;

  if (input.existingCompanyId) {
    // Joining an existing company via invite
    company_id = input.existingCompanyId;
    role = input.role ?? "viewer";
  } else {
    // Brand new company
    const companyName = (input.companyName ?? `${name}'s Company`).trim();
    company_id = uuidv4();
    role = input.role ?? "owner";

    if (pool) {
      await query(
        `INSERT INTO companies (id, name, email, fiscal_year_start, coa_template, created_at, updated_at)
         VALUES ($1, $2, $3, 'january', 'standard', $4, $4)`,
        [company_id, companyName, email, now]
      );
    } else {
      await addToStore("companies", {
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
    }
  }

  if (pool) {
    await query(
      `INSERT INTO users (id, email, name, password_hash, company_id, role, status, invite_token, is_demo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $9)`,
      [user_id, email, name, password_hash, company_id, role, status, invite_token, now]
    );
  } else {
    await addToStore("users", {
      id: user_id,
      email,
      name,
      password_hash,
      company_id,
      role,
      status,
      invite_token,
      is_demo: false,
      created_at: now,
      updated_at: now,
    });
  }

  const created = await findUserById(user_id);
  if (!created) throw new Error("failed to read back created user");
  return created;
}

/**
 * Create a pending (invited) user placeholder with no password yet.
 * Call acceptInvite() after the user completes signup.
 */
export async function createInvitedUser(opts: {
  email: string;
  companyId: string;
  role: UserRole;
  inviteToken: string;
}): Promise<UserRow> {
  const email = opts.email.trim().toLowerCase();

  const existing = await findUserByEmail(email);
  if (existing && existing.company_id === opts.companyId) {
    throw new Error("A user with this email already exists in this company");
  }

  const now = new Date().toISOString();
  const user_id = uuidv4();
  const name = email.split("@")[0];

  if (pool) {
    await query(
      `INSERT INTO users (id, email, name, password_hash, company_id, role, status, invite_token, is_demo, created_at, updated_at)
       VALUES ($1, $2, $3, '', $4, $5, 'pending', $6, false, $7, $7)`,
      [user_id, email, name, opts.companyId, opts.role, opts.inviteToken, now]
    );
  } else {
    await addToStore("users", {
      id: user_id,
      email,
      name,
      password_hash: "",
      company_id: opts.companyId,
      role: opts.role,
      status: "pending",
      invite_token: opts.inviteToken,
      is_demo: false,
      created_at: now,
      updated_at: now,
    });
  }

  const created = await findUserById(user_id);
  if (!created) throw new Error("failed to create invited user");
  return created;
}

/**
 * Accept an invite: set the user's real name + password, clear the token, mark active.
 */
export async function acceptInvite(opts: {
  userId: string;
  name: string;
  password: string;
}): Promise<UserRow | null> {
  if (opts.password.length < 8)
    throw new Error("password must be at least 8 characters");
  const password_hash = hashPassword(opts.password);
  const now = new Date().toISOString();

  if (pool) {
    const res = await query(
      `UPDATE users SET name = $1, password_hash = $2, status = 'active', invite_token = NULL, updated_at = $3
       WHERE id = $4
       RETURNING id, email, name, password_hash, company_id, role, status, invite_token, is_demo, created_at, updated_at`,
      [opts.name.trim(), password_hash, now, opts.userId]
    );
    const row = res.rows[0];
    return row ? normalizeUserRow(row) : null;
  }

  const updated = await updateInStore("users", opts.userId, {
    name: opts.name.trim(),
    password_hash,
    status: "active",
    invite_token: null,
    updated_at: now,
  });
  return updated ? normalizeUserRow(updated) : null;
}

export async function countUsers(): Promise<number> {
  if (pool) {
    const res = await query("SELECT COUNT(*)::int AS c FROM users", []);
    return Number(res.rows[0]?.c ?? 0);
  }
  return (await listFromStore("users")).length;
}
