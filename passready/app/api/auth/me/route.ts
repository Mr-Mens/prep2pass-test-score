import { NextResponse } from "next/server";

import { getCachedLearnerAccessStatus } from "@/lib/server/learner-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseClientEnvConfigured } from "@/lib/supabase/url";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  if (!isSupabaseClientEnvConfigured()) {
    return NextResponse.json({ user: null }, noStore);
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email?.trim()) {
      return NextResponse.json({ user: null }, noStore);
    }

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const firstName =
      (typeof meta?.first_name === "string" && meta.first_name.trim()) ||
      (typeof meta?.firstName === "string" && meta.firstName.trim()) ||
      "";

    const access = await getCachedLearnerAccessStatus(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email.trim().toLowerCase(),
          emailConfirmedAt: user.email_confirmed_at ?? null,
          firstName,
          lifetimeAccess: access.lifetimeAccess,
          isGraduated: access.isGraduated,
          subscriptionStatus: access.subscriptionStatus,
          role: access.role,
          hasUsedFreeAssessment: access.hasUsedFreeAssessment,
          canStartAssessment: access.canStartAssessment,
          freeAssessmentScore: access.freeAssessmentScore,
          freeAssessmentLabel: access.freeAssessmentLabel,
        },
      },
      noStore,
    );
  } catch {
    console.error("[api/auth/me] session read failed");
    return NextResponse.json({ user: null, error: "Unable to read session." }, { status: 500, ...noStore });
  }
}
