import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { findUserById, updateUserRole, removeUserFromCompany } from "@/lib/users";
import { canManageUsers, assignableRoles } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import { asRecord, getEnum } from "@/lib/validate";
import { ValidationError } from "@/lib/validate";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["owner", "admin", "editor", "viewer", "accountant"] as const;

type RouteCtx = { params: Promise<{ id: string }> };

// Helper to safely read session user fields regardless of NextAuth v5 beta type variance
function sessionUser(session: any): { id?: string; role?: UserRole; companyId?: string } {
  return (session as any)?.user ?? {};
}

/** PUT /api/team/[id] — update a team member's role */
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const su = sessionUser(session);
  const actorRole = (su.role ?? "owner") as UserRole;
  if (!canManageUsers(actorRole)) {
    return NextResponse.json({ error: "Forbidden: manage_users permission required" }, { status: 403 });
  }

  const companyId = su.companyId;
  if (!companyId) {
    return NextResponse.json({ error: "No company associated with session" }, { status: 400 });
  }

  const { id } = await ctx.params;

  const target = await findUserById(id);
  if (!target || target.company_id !== companyId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent demoting or changing owner role unless actor is owner
  if (target.role === "owner" && actorRole !== "owner") {
    return NextResponse.json({ error: "Only the owner can change the owner's role" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = asRecord(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let newRole: UserRole;
  try {
    newRole = getEnum(body, "role", VALID_ROLES, { required: true })! as UserRole;
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  // Validate actor can assign this role
  const allowed = assignableRoles(actorRole);
  if (!allowed.includes(newRole)) {
    return NextResponse.json(
      { error: `Your role cannot assign the '${newRole}' role` },
      { status: 403 }
    );
  }

  const updated = await updateUserRole(id, newRole);
  if (!updated) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }

  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    status: updated.status,
  });
}

/** DELETE /api/team/[id] — remove a team member */
export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const su = sessionUser(session);
  const actorRole = (su.role ?? "owner") as UserRole;
  if (!canManageUsers(actorRole)) {
    return NextResponse.json({ error: "Forbidden: manage_users permission required" }, { status: 403 });
  }

  const companyId = su.companyId;
  if (!companyId) {
    return NextResponse.json({ error: "No company associated with session" }, { status: 400 });
  }

  const actorId = su.id;
  const { id } = await ctx.params;

  // Prevent self-removal
  if (id === actorId) {
    return NextResponse.json({ error: "You cannot remove yourself from the team" }, { status: 400 });
  }

  const target = await findUserById(id);
  if (!target || target.company_id !== companyId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only owner can remove another owner
  if (target.role === "owner" && actorRole !== "owner") {
    return NextResponse.json({ error: "Only the owner can remove another owner" }, { status: 403 });
  }

  const removed = await removeUserFromCompany(id, companyId);
  if (!removed) {
    return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
