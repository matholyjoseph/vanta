import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const GUEST_COOKIE_NAME = "vanta_guest_session";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/studio",
  "/projects",
  "/assets",
  "/account",
  "/billing",
  "/admin",
  "/cinema",
  "/editor",
  "/director",
  "/shorts",
  "/workspaces",
];

const AUTH_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth",
];

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "vanta-ai-fallback-secret-key-32-chars";

  let token = null;
  try {
    token = await getToken({ req, secret });
  } catch {}

  const hasGuestSession = Boolean(req.cookies.get(GUEST_COOKIE_NAME)?.value);
  const isAuthenticated = Boolean(token) || hasGuestSession;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Admin routes strictly require full authenticated user account
  if (pathname.startsWith("/admin") && !token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If attempting to access a protected route while logged out (and no guest session), redirect to /auth/login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If visiting auth page while logged in with full user account (and not in explicit onboarding), redirect to /dashboard
  if (isAuthRoute && Boolean(token) && !searchParams.has("onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/studio/:path*",
    "/projects/:path*",
    "/assets/:path*",
    "/account/:path*",
    "/billing/:path*",
    "/admin/:path*",
    "/cinema/:path*",
    "/editor/:path*",
    "/director/:path*",
    "/shorts/:path*",
    "/workspaces/:path*",
    "/auth/:path*",
  ],
};
