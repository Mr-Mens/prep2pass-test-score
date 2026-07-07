import "server-only";

import { normalizeAccountStatus, type AccountStatus } from "@/lib/account/account-status";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export const ACCOUNT_STATUS_MIGRATION_HINT =
  "Run supabase/migrations/024_user_account_status.sql in the Supabase SQL Editor to enable pause and reinstate.";

function isMissingAccountStatusColumnError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("account_status") && (message.includes("column") || message.includes("does not exist"));
}

export async function isAccountStatusModuleReady(): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_app_profiles").select("account_status").limit(1);
  return !isMissingAccountStatusColumnError(error);
}

export async function getAccountStatus(userId: string): Promise<AccountStatus> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_app_profiles")
    .select("account_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingAccountStatusColumnError(error)) return "active";
    console.warn("[account-status] getAccountStatus failed", error.message);
    return "active";
  }

  return normalizeAccountStatus((data as { account_status?: string } | null)?.account_status);
}

export async function isAccountPaused(userId: string): Promise<boolean> {
  return (await getAccountStatus(userId)) === "paused";
}
