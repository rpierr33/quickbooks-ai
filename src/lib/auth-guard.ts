import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { UserRole } from "./roles";
import { hasPermission, canWrite, canDelete } from "./roles";

type AuthResult =
  | { session: Session; unauthorized: null }
  | { session: null; unauthorized: NextResponse };

/**
 * Check if the current request is authenticated.
 * Returns the session if authenticated, or a 401 NextResponse if not.
 */
export async function requireAuth(): Promise<AuthResult> {
  const rawSession = await auth();
  // NextAuth v5 auth() can resolve to Session | NextMiddleware | null.
  // We only care about the Session branch — cast it here.
  const session = rawSession as Session | null;
  if (!session || typeof session === "function") {
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { session, unauthorized: null };
}

/**
 * Require a specific role or higher.
 * Returns session if allowed, or a 403 NextResponse if the role is insufficient.
 *
 * Role hierarchy (ascending privilege): viewer < accountant < editor < admin < owner
 */
export async function requireRole(
  minimumRole: UserRole
): Promise<AuthResult> {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return { session: null, unauthorized };

  const userRole = ((session.user as { role?: UserRole }).role ??
    "owner") as UserRole;

  if (!roleAtLeast(userRole, minimumRole)) {
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: "Forbidden: insufficient role" },
        { status: 403 }
      ),
    };
  }
  return { session, unauthorized: null };
}

/**
 * Require a specific permission string.
 * Returns session if allowed, or 403 if not.
 */
export async function requirePermission(
  permission: string
): Promise<AuthResult> {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return { session: null, unauthorized };

  const userRole = ((session.user as { role?: UserRole }).role ??
    "owner") as UserRole;

  if (!hasPermission(userRole, permission)) {
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: `Forbidden: '${permission}' permission required` },
        { status: 403 }
      ),
    };
  }
  return { session, unauthorized: null };
}

/**
 * Require write permission — blocks viewer and accountant on regular write routes.
 * Accountants may only write journal entries and reconciliation.
 */
export async function requireWrite(): Promise<AuthResult> {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return { session: null, unauthorized };

  const userRole = ((session.user as { role?: UserRole }).role ??
    "owner") as UserRole;

  if (!canWrite(userRole)) {
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: "Forbidden: write permission required" },
        { status: 403 }
      ),
    };
  }
  return { session, unauthorized: null };
}

/**
 * Require delete permission — blocks viewer, accountant, editor.
 */
export async function requireDelete(): Promise<AuthResult> {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return { session: null, unauthorized };

  const userRole = ((session.user as { role?: UserRole }).role ??
    "owner") as UserRole;

  if (!canDelete(userRole)) {
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: "Forbidden: delete permission required" },
        { status: 403 }
      ),
    };
  }
  return { session, unauthorized: null };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Role privilege index — higher number means more privilege. */
const ROLE_RANK: Record<UserRole, number> = {
  viewer: 0,
  accountant: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

function roleAtLeast(actual: UserRole, minimum: UserRole): boolean {
  return (ROLE_RANK[actual] ?? 0) >= (ROLE_RANK[minimum] ?? 0);
}

// Re-export helpers for convenience in route handlers
export { hasPermission, canWrite, canDelete };
