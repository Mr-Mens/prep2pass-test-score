import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/reports",
  "/progress",
  "/account",
  "/instructor",
  "/supervisor",
];

const authRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth/callback",
];

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (authRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon.ico") ||
      pathname.startsWith("/home") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms")
    ) {
      return NextResponse.next();
    }

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

    if (!isProtected) {
      return NextResponse.next();
    }

    const hasSupabaseCookie = request.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith("sb-") && cookie.value?.trim());

    if (!hasSupabaseCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware failed:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
