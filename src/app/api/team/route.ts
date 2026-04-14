import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  listUsersByCompany,
  createInvitedUser,
} from "@/lib/users";
import { canManageUsers, assignableRoles } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import { asRecord, getString, getEnum } from "@/lib/validate";
import { ValidationError } from "@/lib/validate";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["owner", "admin", "editor", "viewer", "accountant"] as const;

/** GET /api/team — list all team members for the authenticated company */
export async function GET() {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const companyId = (session.user as { companyId?: string }).companyId;
  if (!companyId) {
    return NextResponse.json({ error: "No company associated with session" }, { status: 400 });
  }

  const users = await listUsersByCompany(companyId);

  // Return safe fields only (no password_hash, no invite_token)
  const safe = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    is_demo: u.is_demo ?? false,
    created_at: u.created_at,
  }));

  return NextResponse.json(safe);
}

/** POST /api/team — invite a new team member */
export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const actorRole = ((session.user as { role?: UserRole }).role ?? "owner") as UserRole;
  if (!canManageUsers(actorRole)) {
    return NextResponse.json({ error: "Forbidden: manage_users permission required" }, { status: 403 });
  }

  const companyId = (session.user as { companyId?: string }).companyId;
  if (!companyId) {
    return NextResponse.json({ error: "No company associated with session" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = asRecord(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let email: string;
  let role: UserRole;

  try {
    const rawEmail = getString(body, "email", { required: true, max: 255 })!;
    email = rawEmail.toLowerCase().trim();
    role = getEnum(body, "role", VALID_ROLES, { required: true })! as UserRole;
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  // Validate the actor can assign this role
  const allowed = assignableRoles(actorRole);
  if (!allowed.includes(role)) {
    return NextResponse.json(
      { error: `Your role cannot assign the '${role}' role` },
      { status: 403 }
    );
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Generate invite token
  const inviteToken = crypto.randomUUID();

  try {
    const invited = await createInvitedUser({
      email,
      companyId,
      role,
      inviteToken,
    });

    // Build invite URL
    const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/signup?invite=${inviteToken}`;

    return NextResponse.json(
      {
        id: invited.id,
        email: invited.email,
        role: invited.role,
        status: invited.status,
        invite_url: inviteUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to invite user";
    const status = msg.toLowerCase().includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
