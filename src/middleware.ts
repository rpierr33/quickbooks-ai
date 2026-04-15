import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse, NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// Routes exempt from CSRF origin validation.
// Includes auth callbacks, public API endpoints, Stripe webhooks, and the
// client portal (which is embedded and may be opened cross-origin).
const CSRF_EXEMPT = [
  '/api/auth',
  '/api/public',
  '/api/payments/webhook',
  '/api/portal',
];

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Inline CSRF check — validates that the request Origin matches the app host.
 * Cannot use dynamic imports in Edge middleware, so the logic is inlined here.
 */
function csrfCheck(req: NextRequest): NextResponse | null {
  if (!MUTATING_METHODS.has(req.method)) return null;

  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/api/')) return null;
  if (CSRF_EXEMPT.some((p) => pathname.startsWith(p))) return null;

  const origin = req.headers.get('origin');
  // No Origin header = same-origin or non-browser call — allow through.
  if (!origin) return null;

  const host = req.headers.get('host') ?? '';
  try {
    const originHost = new URL(origin).host;
    const appHost = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
      : '';

    const isAllowed =
      originHost === host ||
      originHost === appHost ||
      originHost === 'localhost' ||
      originHost.startsWith('localhost:');

    if (!isAllowed) {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF validation failed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid origin header' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}

export default auth((req) => {
  // CSRF check runs before auth so it can reject cross-origin mutation attempts
  // even for unauthenticated routes.
  const csrfResponse = csrfCheck(req);
  if (csrfResponse) return csrfResponse;

  const { pathname } = req.nextUrl;

  // Public routes — no auth required
  const publicPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/billing",
    "/api/auth",
    "/api/public",
    "/api/portal",
    "/api/team/accept",
    "/pay",
    "/portal",
    "/offline",
  ];

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Static assets and Next.js internals are always public
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublic) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.svg, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js).*)",
  ],
};
