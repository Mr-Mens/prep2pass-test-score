import "server-only";

import { redirect } from "next/navigation";

import { isAccountPaused } from "@/lib/server/account-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Sign out and send paused accounts back to login. */
export async function redirectIfAccountPaused(userId: string, nextPath?: string): Promise<void> {
  if (!(await isAccountPaused(userId))) return;

  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();

  const q = new URLSearchParams({ error: "account_paused" });
  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    q.set("next", nextPath);
  }
  redirect(`/login?${q.toString()}`);
}
