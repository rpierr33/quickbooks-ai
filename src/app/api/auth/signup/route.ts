import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/users";
import { rateLimit, pruneExpired } from "@/lib/rate-limit";
import { isConfigured, sendVerificationEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

interface SignupBody {
  email?: string;
  password?: string;
  name?: string;
  companyName?: string;
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  // Rate limiting: 5 signups per IP per hour
  pruneExpired();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const { allowed } = await rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "3600",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim();
  const companyName = (body.companyName ?? "").trim();

  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const user = await createUser({
      email,
      password,
      name,
      companyName: companyName || undefined,
    });

    // Attempt to send verification email if email service is configured
    let emailSent = false;
    if (user._verificationToken && isConfigured()) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";
      const verifyUrl = `${appUrl}/api/auth/verify-email?token=${user._verificationToken}`;
      const result = await sendVerificationEmail(email, verifyUrl);
      emailSent = result.success;
    }

    // If email service isn't configured, auto-verify so the user can log in
    if (!isConfigured() || !emailSent) {
      // We update email_verified=true via a direct query/update
      // (the token was generated but email not sent — dev mode graceful degradation)
      const { updateInStore, pool, query: dbQuery } = await import("@/lib/db");
      if (pool) {
        await dbQuery(
          `UPDATE users SET email_verified = true, verification_token = NULL, verification_expires = NULL WHERE id = $1`,
          [user.id]
        );
      } else {
        await updateInStore("users", user.id, {
          email_verified: true,
          verification_token: null,
          verification_expires: null,
        });
      }
    }

    logAudit({
      companyId: user.company_id ?? '',
      userId: user.id,
      userEmail: user.email,
      action: 'create',
      entityType: 'user',
      entityId: user.id,
      details: { name: user.name },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: user.company_id,
        emailVerificationSent: emailSent,
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signup failed";
    const status = msg.toLowerCase().includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
