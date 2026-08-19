import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/studio",
  "/projects",
  "/assets",
  "/account",
  "/billing",
  "/admin",
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

  const token = await getToken({ req, secret });
  const isAuthenticated = !!token;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If attempting to access a protected route while logged out, redirect to /auth/login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If visiting auth page while logged in (and not in explicit onboarding), redirect to /dashboard
  if (isAuthRoute && isAuthenticated && !searchParams.has("onboarding")) {
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
    "/auth/:path*",
  ],
};
