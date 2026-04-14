import { NextRequest, NextResponse } from "next/server";
import { findUserByInviteToken, acceptInvite } from "@/lib/users";
import { asRecord, getString } from "@/lib/validate";
import { ValidationError } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * GET /api/team/accept?token=TOKEN
 * Validate an invite token and return invite details (company name, role, email).
 * Used by the signup page to show the invite context.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const user = await findUserByInviteToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 404 });
  }
  if (user.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been accepted" }, { status: 409 });
  }

  return NextResponse.json({
    email: user.email,
    role: user.role,
    company_id: user.company_id,
  });
}

/**
 * POST /api/team/accept
 * Accept an invite: set name + password, activate the user.
 * Body: { token: string; name: string; password: string }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = asRecord(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let token: string;
  let name: string;
  let password: string;

  try {
    token = getString(body, "token", { required: true, max: 64 })!;
    name = getString(body, "name", { required: true, min: 2, max: 100 })!;
    password = getString(body, "password", { required: true, min: 8 })!;
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  const user = await findUserByInviteToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 404 });
  }
  if (user.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been accepted" }, { status: 409 });
  }

  try {
    const activated = await acceptInvite({ userId: user.id, name, password });
    if (!activated) {
      return NextResponse.json({ error: "Failed to activate account" }, { status: 500 });
    }

    return NextResponse.json({
      id: activated.id,
      email: activated.email,
      name: activated.name,
      role: activated.role,
      company_id: activated.company_id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to accept invite";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

