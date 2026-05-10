import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";

import type { UserAppRole } from "@/lib/instructor/types";

export async function getUserAppRole(userId: string): Promise<UserAppRole> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("user_app_profiles").select("role").eq("user_id", userId).maybeSingle();

  if (error || !data) return "learner";
  const r = (data as { role: string }).role;
  if (r === "instructor" || r === "parent" || r === "learner") return r;
  return "learner";
}
