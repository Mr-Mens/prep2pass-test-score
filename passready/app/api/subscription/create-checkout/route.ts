import { NextResponse } from "next/server";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { resolveCheckoutPromo } from "@/lib/server/resolve-checkout-promo";
import { createSubscriptionCheckoutSession } from "@/lib/server/stripe";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH_REQUIRED", auth.message);

  const access = await getLearnerAccessStatus(auth.userId);
  if (access.hasPremiumAccess) {
    return jsonError(409, "ALREADY_SUBSCRIBED", "You already have active access.");
  }
  if (access.isGraduated) {
    return jsonError(403, "GRADUATED", "Graduate accounts cannot start a new subscription.");
  }

  let returnPath = "/subscribe/success";
  let promoCode: string | undefined;
  let premiumInviteToken: string | undefined;
  try {
    const body = (await request.json()) as {
      returnPath?: string;
      promoCode?: string;
      premiumInvite?: string;
    };
    if (body.returnPath?.startsWith("/") && !body.returnPath.startsWith("//")) {
      returnPath = body.returnPath;
    }
    if (body.promoCode?.trim()) promoCode = body.promoCode.trim();
    if (body.premiumInvite?.trim()) premiumInviteToken = body.premiumInvite.trim();
  } catch {
    /* default return path */
  }

  try {
    let stripePromotionCodeId: string | undefined;
    let promoMetadata: { adminPromoCodeId?: string; adminPremiumInviteId?: string } | undefined;

    if (promoCode || premiumInviteToken) {
      const resolved = await resolveCheckoutPromo({
        email: auth.email,
        promoCode,
        premiumInviteToken,
      });
      if (!resolved.ok) return jsonError(400, "INVALID_PROMO", resolved.message);
      stripePromotionCodeId = resolved.promo.stripePromotionCodeId;
      promoMetadata = {
        adminPromoCodeId: resolved.promo.promoCodeId,
        ...(resolved.promo.inviteId ? { adminPremiumInviteId: resolved.promo.inviteId } : {}),
      };
    }

    const session = await createSubscriptionCheckoutSession({
      email: auth.email,
      userId: auth.userId,
      returnPath,
      cancelPath: "/subscribe",
      stripePromotionCodeId,
      promoMetadata,
    });
    if (!session.url) return jsonError(500, "STRIPE_SESSION_ERROR", "Could not create checkout session");
    return NextResponse.json({ success: true as const, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("[subscription:create-checkout]", e);
    return jsonError(500, "CHECKOUT_FAILED", "Checkout is temporarily unavailable.");
  }
}
