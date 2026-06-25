import { NextResponse } from "next/server";

import {
  profilePatchInstructorSchema,
  profilePatchLearnerSchema,
  profilePatchParentSchema,
} from "@/lib/profile/validation";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import {
  getUserProfile,
  syncUserProfileFromSignupMetadata,
  upsertUserProfile,
} from "@/lib/server/repositories/user-profiles-repository";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return NextResponse.json({ success: false as const, error: { message } }, { status });
}

export async function GET() {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, auth.message);

  const role = await getUserAppRole(auth.userId);
  let profile = await getUserProfile(auth.userId);

  if (!profile) {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    profile = await syncUserProfileFromSignupMetadata(
      auth.userId,
      user?.user_metadata as Record<string, unknown> | undefined,
    );
  }

  return NextResponse.json({
    success: true as const,
    profile,
    role,
    email: auth.email,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, auth.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }

  const role = await getUserAppRole(auth.userId);

  if (role === "instructor") {
    const parsed = profilePatchInstructorSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(" ");
      return jsonError(400, message || "Invalid profile data.");
    }
    const profile = await upsertUserProfile(auth.userId, {
      full_name: parsed.data.fullName,
      postcode: parsed.data.postcode,
      adi_number: parsed.data.adiNumber,
      teaching_postcode: parsed.data.teachingPostcode,
      preferred_test_centre_area: parsed.data.preferredTestCentreArea,
    });
    if (!profile) return jsonError(500, "Could not save profile.");
    const supabase = createSupabaseServerClient();
    await supabase.auth.updateUser({
      data: {
        full_name: parsed.data.fullName,
        first_name: parsed.data.fullName.trim().split(/\s+/)[0] ?? parsed.data.fullName,
        postcode: parsed.data.postcode,
        adi_number: parsed.data.adiNumber,
        teaching_postcode: parsed.data.teachingPostcode,
        preferred_test_centre_area: parsed.data.preferredTestCentreArea,
      },
    });
    return NextResponse.json({ success: true as const, profile });
  }

  if (role === "parent") {
    const parsed = profilePatchParentSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(" ");
      return jsonError(400, message || "Invalid profile data.");
    }
    const profile = await upsertUserProfile(auth.userId, {
      full_name: parsed.data.fullName,
      postcode: parsed.data.postcode,
    });
    if (!profile) return jsonError(500, "Could not save profile.");
    const supabase = createSupabaseServerClient();
    await supabase.auth.updateUser({
      data: {
        full_name: parsed.data.fullName,
        first_name: parsed.data.fullName.trim().split(/\s+/)[0] ?? parsed.data.fullName,
        postcode: parsed.data.postcode,
      },
    });
    return NextResponse.json({ success: true as const, profile });
  }

  const parsed = profilePatchLearnerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(" ");
    return jsonError(400, message || "Invalid profile data.");
  }
  const profile = await upsertUserProfile(auth.userId, {
    full_name: parsed.data.fullName,
    postcode: parsed.data.postcode,
    preferred_test_centre: parsed.data.preferredTestCentre,
  });
  if (!profile) return jsonError(500, "Could not save profile.");
  const supabase = createSupabaseServerClient();
  await supabase.auth.updateUser({
    data: {
      full_name: parsed.data.fullName,
      first_name: parsed.data.fullName.trim().split(/\s+/)[0] ?? parsed.data.fullName,
      postcode: parsed.data.postcode,
      preferred_test_centre: parsed.data.preferredTestCentre,
    },
  });
  return NextResponse.json({ success: true as const, profile });
}

export async function POST() {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, auth.message);

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await syncUserProfileFromSignupMetadata(
    auth.userId,
    user?.user_metadata as Record<string, unknown> | undefined,
  );

  if (!profile) return jsonError(400, "No profile data to sync.");

  return NextResponse.json({ success: true as const, profile });
}
