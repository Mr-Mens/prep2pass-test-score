import "server-only";

import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

type DbError = { code?: string; message?: string } | null;

/** True when migration 006 tables have not been applied in Supabase yet. */
export function isMissingSupervisorTableError(error: DbError): boolean {
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

export const SUPERVISOR_MIGRATION_HINT =
  "Run supabase/migrations/006_parent_supervisor_module.sql in the Supabase SQL Editor.";

export async function isSupervisorModuleReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("practice_logs").select("id").limit(1);
  return !isMissingSupervisorTableError(error);
}
