import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type SupabaseMiddlewareClient = ReturnType<typeof createServerClient>;

/** Public Supabase client env for Edge middleware (no throw). */
export function readSupabasePublicEnvForEdge(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Maintains refreshed Supabase session cookies and returns the appropriate Next.js response.
 * Edge-only: anon URL + anon key; never service role or lib/server.
 */
export function createSupabaseUpdatingClient(
  request: NextRequest,
  url: string,
  anonKey: string,
): { supabase: SupabaseMiddlewareClient; getResponse: () => NextResponse } {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
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
