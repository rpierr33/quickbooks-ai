import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createInvitedUser } from "@/lib/users";
import { canManageUsers, assignableRoles } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import { asRecord, getString, getEnum } from "@/lib/validate";
import { ValidationError } from "@/lib/validate";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["owner", "admin", "editor", "viewer", "accountant"] as const;

/**
 * POST /api/team/invite
 * Generate an invite link for a new team member.
 * Body: { email: string; role: UserRole }
 */
export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const actorRole = ((session.user as { role?: UserRole }).role ?? "owner") as UserRole;
  if (!canManageUsers(actorRole)) {
    return NextResponse.json(
      { error: "Forbidden: manage_users permission required" },
      { status: 403 }
    );
  }

  const companyId = (session.user as { companyId?: string }).companyId;
  if (!companyId) {
    return NextResponse.json(
      { error: "No company associated with session" },
      { status: 400 }
    );
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const allowed = assignableRoles(actorRole);
  if (!allowed.includes(role)) {
    return NextResponse.json(
      { error: `Your role cannot assign the '${role}' role` },
      { status: 403 }
    );
  }

  const inviteToken = crypto.randomUUID();

  try {
    const invited = await createInvitedUser({ email, companyId, role, inviteToken });

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const inviteUrl = `${baseUrl}/signup?invite=${inviteToken}`;

    return NextResponse.json(
      {
        id: invited.id,
        email: invited.email,
        role: invited.role,
        status: invited.status,
        invite_url: inviteUrl,
        invite_token: inviteToken,
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create invite";
    const status = msg.toLowerCase().includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
