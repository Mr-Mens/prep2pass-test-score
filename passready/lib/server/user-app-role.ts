import "server-only";

import { parseAppRole } from "@/lib/auth/role-from-destination";
import type { SelfServiceAppRole } from "@/lib/auth/self-service-roles";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

import type { UserAppRole } from "@/lib/instructor/types";

function normalizeRole(value: string): UserAppRole {
  if (value === "instructor" || value === "parent" || value === "learner") return value;
  return "learner";
}

async function fetchStoredRole(userId: string): Promise<UserAppRole | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("user_app_profiles").select("role").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return normalizeRole((data as { role: string }).role);
}

async function ensureInstructorProfileRow(userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("instructor_profiles").upsert(
    { user_id: userId, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[ensureUserAppRoleFromIntent] instructor_profile_failed", error.message);
  }
}

export async function getUserAppRole(userId: string): Promise<UserAppRole> {
  const stored = await fetchStoredRole(userId);
  return stored ?? "learner";
}

/** Create a profile row on first signup only; never overwrite an existing role. */
export async function ensureUserAppRoleFromIntent(userId: string, intent: SelfServiceAppRole): Promise<UserAppRole> {
  if (!isSupabaseConfigured()) return intent;

  const existing = await fetchStoredRole(userId);
  if (existing) return existing;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_app_profiles").upsert(
    {
      user_id: userId,
      role: intent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("[ensureUserAppRoleFromIntent]", error.message);
    return intent;
  }

  if (intent === "instructor") {
    await ensureInstructorProfileRow(userId);
  }

  return (await fetchStoredRole(userId)) ?? intent;
}

export function appRoleFromUserMetadata(metadata: Record<string, unknown> | undefined): UserAppRole | null {
  return parseAppRole(metadata?.app_role);
}
