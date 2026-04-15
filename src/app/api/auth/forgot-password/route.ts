import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/users";
import { isConfigured, sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, pruneExpired } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Always returns 200 — never reveals whether the email exists.
 */
export async function POST(req: NextRequest) {
  pruneExpired();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // 5 reset requests per IP per hour
  const { allowed } = rateLimit(`forgot-pw:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    // Still return 200 to avoid timing-based email enumeration
    return NextResponse.json(
      { message: "If an account with that email exists, we've sent a reset link." },
      { status: 200 }
    );
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const token = await createPasswordResetToken(email);

    if (token && isConfigured()) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return the same response regardless of whether the email exists
    return NextResponse.json(
      { message: "If an account with that email exists, we've sent a reset link." },
      { status: 200 }
    );
  } catch {
    // Silently succeed — don't leak internal errors that could reveal email existence
    return NextResponse.json(
      { message: "If an account with that email exists, we've sent a reset link." },
      { status: 200 }
    );
  }
}
