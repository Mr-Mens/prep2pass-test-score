import { NextResponse } from "next/server";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH_REQUIRED", auth.message);

  const access = await getLearnerAccessStatus(auth.userId);
  return NextResponse.json({
    success: true as const,
    isGraduated: access.isGraduated,
    passDate: access.passDate,
    hasPremiumAccess: access.hasPremiumAccess,
    canStartAssessment: access.canStartAssessment,
    subscriptionStatus: access.subscriptionStatus,
    accessSource: access.accessSource,
    lifetimeAccess: access.lifetimeAccess,
  });
}
