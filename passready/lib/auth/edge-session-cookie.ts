import type { NextRequest } from "next/server";

/**
 * Edge-safe session hint: Supabase SSR stores chunked `sb-*-auth-token` cookies.
 * Does not validate JWTs — server components / route handlers call `getUser()`.
 */
export function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => {
    if (!cookie.value?.trim()) return false;
    return cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token");
  });
}
