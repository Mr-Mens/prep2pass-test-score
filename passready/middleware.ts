import { NextResponse, type NextRequest } from "next/server";

import { isStandaloneAuthRoute } from "./lib/auth-shell-routes";
import { createSupabaseUpdatingClient } from "./lib/supabase/middleware";
import { isSupabaseClientEnvConfigured } from "./lib/supabase/url";

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

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  try {
    if (!isSupabaseClientEnvConfigured()) {
      console.warn("[middleware] Supabase anon env missing; skipping session refresh");
      return NextResponse.next();
    }

    const { supabase, getResponse } = createSupabaseUpdatingClient(request);
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("[middleware] getUser failed:", error.message);
    }
    const user = data?.user ?? null;
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
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
