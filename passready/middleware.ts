import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseUpdatingClient } from "@/lib/supabase/middleware";
import { isSupabaseClientEnvConfigured } from "@/lib/supabase/url";

function isAuthUi(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth/callback")
  );
}

function requiresConfirmedUser(pathname: string): boolean {
  return (
    pathname.startsWith("/assessment") ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/upgrade") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/my-reports") ||
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

  if (!isSupabaseClientEnvConfigured()) {
    console.warn("[middleware] Supabase anon env missing; skipping session refresh");
    return NextResponse.next();
  }

  const { supabase, getResponse } = createSupabaseUpdatingClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
      url.pathname = "/my-reports";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return res;
  }

  if (user?.email_confirmed_at && isAuthUi(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/my-reports";
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
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
