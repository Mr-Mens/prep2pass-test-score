import { NextResponse } from "next/server";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { syncSubscriptionForUserFromStripe } from "@/lib/server/sync-user-subscription-from-stripe";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function POST() {
  try {
    const auth = await requireVerifiedApiUser();
    if (!auth.ok) {
      return jsonError(auth.status, "AUTH_REQUIRED", auth.message);
    }

    await syncSubscriptionForUserFromStripe(auth.userId);
    const access = await getLearnerAccessStatus(auth.userId);

    return NextResponse.json({
      success: true as const,
      hasPremiumAccess: access.hasPremiumAccess,
      subscriptionStatus: access.subscriptionStatus,
    });
  } catch (error) {
    console.error("[subscription:sync]", error);
    return jsonError(500, "INTERNAL_ERROR", "Could not sync subscription.");
  }
}
