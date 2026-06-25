import { NextResponse } from "next/server";
import Stripe from "stripe";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { confirmSubscriptionCheckoutForUser } from "@/lib/server/sync-user-subscription-from-stripe";
import { confirmUpgradeRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  return jsonError(405, "METHOD_NOT_ALLOWED", "Only POST is supported");
}

export async function POST(request: Request) {
  try {
    const auth = await requireVerifiedApiUser();
    if (!auth.ok) {
      return jsonError(auth.status, "AUTH_REQUIRED", auth.message);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "Request body must be valid JSON");
    }

    const parsed = confirmUpgradeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid sessionId");
    }

    const confirmed = await confirmSubscriptionCheckoutForUser(parsed.data.sessionId, auth.userId);
    if (!confirmed) {
      return jsonError(
        402,
        "SUBSCRIPTION_PENDING",
        "Your subscription is not confirmed yet. Wait a moment and refresh this page.",
      );
    }

    const access = await getLearnerAccessStatus(auth.userId);
    return NextResponse.json({
      success: true as const,
      hasPremiumAccess: access.hasPremiumAccess,
      subscriptionStatus: access.subscriptionStatus,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_SUBSCRIPTION_CHECKOUT") {
        return jsonError(400, "NOT_SUBSCRIPTION", "This checkout is not a subscription.");
      }
      if (error.message === "CHECKOUT_OWNERSHIP") {
        return jsonError(403, "CHECKOUT_OWNERSHIP", "This checkout is not tied to your account.");
      }
    }
    if (error instanceof Stripe.errors.StripeError) {
      return jsonError(502, "STRIPE_ERROR", "Unable to verify subscription with Stripe.");
    }
    console.error("[subscription:confirm-checkout]", error);
    return jsonError(500, "INTERNAL_ERROR", "Could not confirm subscription.");
  }
}
