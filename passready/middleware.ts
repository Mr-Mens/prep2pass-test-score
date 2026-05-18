import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseAuthCookie } from "@/lib/auth/edge-session-cookie";

const PUBLIC_EXACT = new Set(["/", "/privacy", "/terms", "/explore", "/sample-report", "/favicon.ico"]);

const PUBLIC_PREFIXES = [
  "/_next",
  "/api/",
  "/auth/callback",
  "/auth/resume",
  "/report-lookup",
  "/admin",
  "/home",
] as const;

const AUTH_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"] as const;

/** Routes that need a session cookie; role + email checks stay in layouts/pages. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/progress",
  "/account",
  "/instructor",
  "/supervisor",
  "/my-reports",
  "/lifetime",
  "/reports/",
] as const;

function isStaticAsset(pathname: string): boolean {
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(pathname);
}

function shouldBypassMiddleware(pathname: string): boolean {
  if (isStaticAsset(pathname)) return true;
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return true;
  if (AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return false;
}

function requiresAuthSession(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypassMiddleware(pathname)) {
    return NextResponse.next();
  }

  try {
    if (!requiresAuthSession(pathname)) {
      return NextResponse.next();
    }

    if (!hasSupabaseAuthCookie(request)) {
      return redirectToLogin(request, pathname);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[middleware] error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
