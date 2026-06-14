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

export async function isCommercialModuleReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_subscriptions").select("user_id").limit(1);
  return !isMissingCommercialTableError(error);
}
