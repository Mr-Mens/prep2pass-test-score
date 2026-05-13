import { NextResponse, type NextRequest } from "next/server";

import { isStandaloneAuthRoute } from "./lib/auth-shell-routes";
import { createSupabaseUpdatingClient } from "./lib/supabase/middleware";
import { isSupabaseClientEnvConfigured } from "./lib/supabase/url";

/** Paths where we skip Supabase session work (marketing / static-like). Matcher stays minimal so builds never choke on regex parsing. */
function shouldBypassAuthMiddleware(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) return true;
  if (pathname === "/" || pathname === "/privacy" || pathname === "/terms") return true;
  if (pathname === "/explore" || pathname === "/sample-report") return true;
  if (pathname.startsWith("/report-lookup")) return true;
  if (pathname.startsWith("/admin")) return true;
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
    if (!isSupabaseClientEnvConfigured()) {
      console.warn("[middleware] Supabase anon env missing; skipping session refresh");
      return NextResponse.next();
    }

    const { supabase, getResponse } = createSupabaseUpdatingClient(request);
    /** Edge: avoid `getUser()` here — it calls Supabase Auth on every request and often breaks Vercel middleware (timeouts / invocation failures). Session comes from refreshed cookies; layouts/API can still call `getUser()` server-side for verified checks. */
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
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
    console.error("[middleware] unhandled:", e);
    return NextResponse.next();
  }
}

export const config = {
  /** Same shape as Next.js docs — avoids fragile matchers that break some compilers with errors like Unhandled type ColonToken. Narrow behaviour inside middleware instead. */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
