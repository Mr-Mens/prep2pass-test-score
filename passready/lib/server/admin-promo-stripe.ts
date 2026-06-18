import "server-only";

import { getStripeServerClient } from "@/lib/server/stripe";
import type { AdminPromoDiscountPercent } from "@/lib/admin/promo-discounts";

export async function createStripePromoForDiscount(params: {
  code: string;
  discountPercent: AdminPromoDiscountPercent;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}) {
  const stripe = getStripeServerClient();
  const normalizedCode = params.code.trim().toUpperCase();

  const coupon = await stripe.coupons.create({
    percent_off: params.discountPercent,
    duration: "forever",
    name: `Pass Pilot ${params.discountPercent}%`,
    metadata: {
      pass_pilot_discount_percent: String(params.discountPercent),
    },
  });

  const promotionCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: normalizedCode,
    ...(params.maxRedemptions != null ? { max_redemptions: params.maxRedemptions } : {}),
    ...(params.expiresAt ? { expires_at: Math.floor(params.expiresAt.getTime() / 1000) } : {}),
    metadata: {
      pass_pilot_discount_percent: String(params.discountPercent),
    },
  });

  return {
    code: normalizedCode,
    stripeCouponId: coupon.id,
    stripePromotionCodeId: promotionCode.id,
  };
}

export async function deactivateStripePromotionCode(stripePromotionCodeId: string) {
  const stripe = getStripeServerClient();
  return stripe.promotionCodes.update(stripePromotionCodeId, { active: false });
}
