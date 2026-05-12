import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl } from "./url";

/**
 * Maintains refreshed Supabase session cookies and returns the appropriate Next.js response.
 * Call from root `middleware.ts` after optional route guards read `supabase.auth.getUser()`.
 */
export function createSupabaseUpdatingClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        /** Edge (e.g. Vercel): mutating `request.cookies` throws; only `response.cookies` is supported. */
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          if (value) {
            response.cookies.set(name, value, options);
          } else {
            response.cookies.delete(name);
          }
        });
      },
    },
  });

  return { supabase, getResponse: () => response };
}
