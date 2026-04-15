import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/lib/users";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/verify-email?token=XXX
 *
 * Consumes the one-time email verification token.
 * Redirects to /login?verified=true on success.
 * Redirects to /login?error=invalid_token on failure.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "invalid_token");
    return NextResponse.redirect(url, { status: 302 });
  }

  try {
    const user = await verifyEmail(token);

    if (!user) {
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "invalid_token");
      return NextResponse.redirect(url, { status: 302 });
    }

    const url = new URL("/login", req.url);
    url.searchParams.set("verified", "true");
    return NextResponse.redirect(url, { status: 302 });
  } catch {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "invalid_token");
    return NextResponse.redirect(url, { status: 302 });
  }
}
