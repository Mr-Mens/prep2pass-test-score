import { NextResponse } from "next/server";

import { getUserAppRole } from "@/lib/server/user-app-role";
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

    let lifetimeAccess = false;
    let isGraduated = false;
    let subscriptionStatus: string | null = null;
    let hasUsedFreeAssessment = false;
    let canStartAssessment = true;
    let freeAssessmentScore: number | null = null;
    let freeAssessmentLabel: string | null = null;
    try {
      const access = await import("@/lib/server/learner-access").then((m) => m.getLearnerAccessStatus(user.id));
      lifetimeAccess = access.hasPremiumAccess;
      isGraduated = access.isGraduated;
      subscriptionStatus = access.subscriptionStatus;
      hasUsedFreeAssessment = access.hasUsedFreeAssessment;
      canStartAssessment = access.canStartAssessment;
      freeAssessmentScore = access.freeAssessmentScore;
      freeAssessmentLabel = access.freeAssessmentLabel;
    } catch {
      lifetimeAccess = false;
    }

    const role = await getUserAppRole(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email.trim().toLowerCase(),
          emailConfirmedAt: user.email_confirmed_at ?? null,
          firstName,
          lifetimeAccess,
          isGraduated,
          subscriptionStatus,
          role,
          hasUsedFreeAssessment,
          canStartAssessment,
          freeAssessmentScore,
          freeAssessmentLabel,
        },
      },
      noStore,
    );
  } catch {
    console.error("[api/auth/me] session read failed");
    return NextResponse.json({ user: null, error: "Unable to read session." }, { status: 500, ...noStore });
  }
}
