import "server-only";

import { normalizeEmail } from "@/lib/normalize-email";
import { getSupabaseServerClient } from "@/lib/server/supabase";

/** Resolve learner auth user id from saved reports (same approach as parent linking). */
export async function resolveLearnerUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const normalized = normalizeEmail(email);

  const { data: reportRow } = await supabase
    .from("reports")
    .select("user_id")
    .ilike("email", normalized)
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reportRow && (reportRow as { user_id: string | null }).user_id) {
    return (reportRow as { user_id: string }).user_id;
  }

  return null;
}
