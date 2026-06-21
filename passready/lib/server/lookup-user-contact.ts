import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";

export async function lookupUserContact(userId: string): Promise<{
  email: string | null;
  firstName: string | null;
}> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    return { email: null, firstName: null };
  }
  const meta = data.user.user_metadata as Record<string, unknown> | undefined;
  const firstRaw = meta?.first_name;
  const firstName = typeof firstRaw === "string" && firstRaw.trim() ? firstRaw.trim() : null;
  const email = data.user.email?.trim().toLowerCase() ?? null;
  return { email, firstName };
}
