import { NextResponse, type NextRequest } from "next/server";

import { isStandaloneAuthRoute } from "./lib/auth-shell-routes";
import {
  createSupabaseUpdatingClient,
  readSupabasePublicEnvForEdge,
  type SupabaseMiddlewareClient,
} from "./lib/supabase/middleware";

/**
 * Skip Edge auth work for static assets, APIs (incl. Stripe webhooks), marketing, OAuth callback, etc.
 * Matcher also excludes `/api/*`; this list is defence-in-depth.
 */
function shouldBypassAuthMiddleware(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/api/")) return true;
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(pathname)) return true;
  if (pathname === "/" || pathname === "/privacy" || pathname === "/terms") return true;
  if (pathname === "/explore" || pathname === "/sample-report") return true;
  if (pathname.startsWith("/report-lookup")) return true;
  if (pathname.startsWith("/admin")) return true;
  /** PKCE exchange must run before session cookies exist — never intercept. */
  if (pathname.startsWith("/auth/callback")) return true;
  return false;
}

function requiresConfirmedUser(pathname: string): boolean {
  return (
    pathname.startsWith("/assessment") ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/upgrade") ||
    pathname.startsWith("/home") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/lifetime") ||
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/my-reports") ||
    pathname.startsWith("/supervisor") ||
    pathname.startsWith("/reports/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypassAuthMiddleware(pathname)) {
    return NextResponse.next();
  }

  try {
    const pub = readSupabasePublicEnvForEdge();
    if (!pub) {
      console.warn("[middleware] Supabase public env missing; skipping session refresh");
      return NextResponse.next();
    }

    let supabase: SupabaseMiddlewareClient;
    let getResponse: () => NextResponse;
    try {
      const client = createSupabaseUpdatingClient(request, pub.url, pub.anonKey);
      supabase = client.supabase;
      getResponse = client.getResponse;
    } catch (e) {
      console.error("[middleware] Supabase client init failed:", e);
      return NextResponse.next();
    }

    let user: { email_confirmed_at?: string | null } | null = null;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      user = session?.user ?? null;
    } catch (e) {
      console.error("[middleware] getSession failed:", e);
      return NextResponse.next();
    }

    let res = getResponse();

    const redirectLogin = () => {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    };

    if (pathname.startsWith("/verify-email")) {
      if (!user) {
        return redirectLogin();
      }
      if (user.email_confirmed_at) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/resume";
        const cont = request.nextUrl.searchParams.get("continue");
        if (typeof cont === "string" && cont.startsWith("/") && !cont.startsWith("//")) {
          url.searchParams.set("continue", cont);
        } else {
          url.search = "";
        }
        return NextResponse.redirect(url);
      }
      return res;
    }

    if (user?.email_confirmed_at && isStandaloneAuthRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/resume";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (requiresConfirmedUser(pathname)) {
      if (!user) return redirectLogin();
      if (!user.email_confirmed_at) {
        const url = request.nextUrl.clone();
        url.pathname = "/verify-email";
        url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(url);
      }
    }

    return res;
  } catch (e) {
    console.error("[middleware] error:", e);
    return NextResponse.next();
  }
}

/**
 * Exclude APIs (Stripe webhooks, etc.), Next internals, favicon from Edge middleware entirely.
 * Matches Next.js documented shape (single outer group, no nested captures).
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
