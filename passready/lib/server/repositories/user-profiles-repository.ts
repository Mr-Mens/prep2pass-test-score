import "server-only";

import { profileInputFromSignupMetadata } from "@/lib/profile/resolve-display-name";
import type { UserProfileInput, UserProfileRow } from "@/lib/profile/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function rowToProfile(data: Record<string, unknown>): UserProfileRow {
  return {
    user_id: String(data.user_id),
    full_name: typeof data.full_name === "string" ? data.full_name : null,
    postcode: typeof data.postcode === "string" ? data.postcode : null,
    preferred_test_centre:
      typeof data.preferred_test_centre === "string" ? data.preferred_test_centre : null,
    adi_number: typeof data.adi_number === "string" ? data.adi_number : null,
    teaching_postcode: typeof data.teaching_postcode === "string" ? data.teaching_postcode : null,
    preferred_test_centre_area:
      typeof data.preferred_test_centre_area === "string" ? data.preferred_test_centre_area : null,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
  };
}

export async function getUserProfile(userId: string): Promise<UserProfileRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data as Record<string, unknown>);
}

async function syncInstructorProfileSidecar(userId: string, input: UserProfileInput): Promise<void> {
  const supabase = createSupabaseServerClient();
  const patch: Record<string, string> = {};
  if (input.full_name) patch.display_name = input.full_name;
  if (input.adi_number) patch.adi_number_placeholder = input.adi_number;
  if (!Object.keys(patch).length) return;

  await supabase.from("instructor_profiles").upsert(
    {
      user_id: userId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function upsertUserProfile(userId: string, input: UserProfileInput): Promise<UserProfileRow | null> {
  const supabase = createSupabaseServerClient();
  const payload = {
    user_id: userId,
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[user_profiles] upsert_failed", error?.message);
    return null;
  }

  if (input.adi_number || input.full_name) {
    try {
      await syncInstructorProfileSidecar(userId, input);
    } catch (e) {
      console.warn("[user_profiles] instructor_sidecar_sync_failed", e);
    }
  }

  return rowToProfile(data as Record<string, unknown>);
}

/** Idempotent: create profile row from signup metadata without overwriting existing DB values. */
export async function syncUserProfileFromSignupMetadata(
  userId: string,
  metadata: Record<string, unknown> | undefined,
): Promise<UserProfileRow | null> {
  const input = profileInputFromSignupMetadata(metadata);
  if (!input) return null;

  const existing = await getUserProfile(userId);
  if (existing) {
    const merged: UserProfileInput = {
      full_name: existing.full_name ?? input.full_name ?? null,
      postcode: existing.postcode ?? input.postcode ?? null,
      preferred_test_centre: existing.preferred_test_centre ?? input.preferred_test_centre ?? null,
      adi_number: existing.adi_number ?? input.adi_number ?? null,
      teaching_postcode: existing.teaching_postcode ?? input.teaching_postcode ?? null,
      preferred_test_centre_area:
        existing.preferred_test_centre_area ?? input.preferred_test_centre_area ?? null,
    };
    return upsertUserProfile(userId, merged);
  }

  return upsertUserProfile(userId, input);
}
