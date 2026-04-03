import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Check if the current request is authenticated.
 * Returns the session if authenticated, or a 401 NextResponse if not.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    return { session: null, unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, unauthorized: null };
}
