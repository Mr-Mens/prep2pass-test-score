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
      setAll(cookiesToSet, headers) {
        /**
         * Edge (Vercel): only mutate `response` cookies/headers, not `request`.
         * @supabase/ssr ≥0.10 passes a second arg with Cache-Control so auth
         * responses are not cached by CDNs (required for safe sessions).
         * Removals use `value: ""` with maxAge: 0 — do not use `delete()` only.
         */
        try {
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          if (headers) {
            for (const [key, val] of Object.entries(headers)) {
              response.headers.set(key, val);
            }
          }
        } catch (e) {
          console.error("[middleware] setAll failed:", e);
        }
      },
    },
  });

  return { supabase, getResponse: () => response };
}
