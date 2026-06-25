import "server-only";

import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

type DbError = { code?: string; message?: string } | null;

/** True when migration 010 tables have not been applied in Supabase yet. */
export function isMissingCommercialTableError(error: DbError): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist")
  );
}

export const COMMERCIAL_MIGRATION_HINT =
  "Run supabase/migrations/010_commercial_model_v1.sql in the Supabase SQL Editor.";

export const COMMISSION_MIGRATION_HINT =
  "Run supabase/migrations/021_instructor_referral_commissions.sql in the Supabase SQL Editor.";

export const PROMO_MIGRATION_HINT =
  "Run supabase/migrations/014_admin_promo_invites.sql and 023_admin_promotions.sql in the Supabase SQL Editor, then reload the API schema cache in Supabase (Settings → API).";

export function isSupabaseNetworkError(error: DbError): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("etimedout") ||
    msg.includes("timeout")
  );
}

export async function isPromoModuleReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("admin_promo_codes").select("id").limit(1);
  if (!error) return true;
  if (isMissingCommercialTableError(error)) return false;
  if (isSupabaseNetworkError(error)) throw new Error("SUPABASE_UNREACHABLE");
  return false;
}
export async function isCommercialModuleReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_subscriptions").select("user_id").limit(1);
  if (!error) return true;
  if (isMissingCommercialTableError(error)) return false;
  if (isSupabaseNetworkError(error)) throw new Error("SUPABASE_UNREACHABLE");
  return false;
}
