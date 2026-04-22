import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedAdmin: SupabaseClient<any> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

/** True when both URL and service role key are set (trimmed non-empty). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key);
}

export function getSupabaseServerClient() {
  if (cachedAdmin) return cachedAdmin;
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  cachedAdmin = createClient<any>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdmin;
}
