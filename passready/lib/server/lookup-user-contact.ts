import "server-only";

import { resolveProfileFirstName } from "@/lib/profile/resolve-display-name";
import { getUserProfile } from "@/lib/server/repositories/user-profiles-repository";
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
  const profile = await getUserProfile(userId);
  const firstName = resolveProfileFirstName(profile, meta) || null;
  const email = data.user.email?.trim().toLowerCase() ?? null;
  return { email, firstName };
}
