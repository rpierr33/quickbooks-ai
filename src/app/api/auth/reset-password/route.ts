import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/users";
import { rateLimit, pruneExpired } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reset-password
 * Body: { token: string, password: string }
 */
export async function POST(req: NextRequest) {
  pruneExpired();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // 10 attempts per IP per hour to prevent brute-forcing tokens
  const { allowed } = await rateLimit(`reset-pw:${ip}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: { token?: string; password?: string };
  try {
    body = (await req.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const password = body.password ?? "";

  if (!token) {
    return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const success = await resetPassword(token, password);

    if (!success) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
