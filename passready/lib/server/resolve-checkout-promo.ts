import "server-only";

import { normalizeEmail } from "@/lib/normalize-email";
import {
  getAdminPremiumInviteByToken,
  getAdminPromoCodeByCode,
  getAdminPromoCodeById,
  isPromoCodeUsable,
  resolvePremiumInviteStatus,
} from "@/lib/server/repositories/admin-promo-repository";

export type ResolvedCheckoutPromo = {
  promoCodeId: string;
  stripePromotionCodeId: string;
  inviteId?: string;
  discountPercent: number;
  code: string;
};

export async function resolveCheckoutPromo(params: {
  email: string;
  promoCode?: string | null;
  premiumInviteToken?: string | null;
}): Promise<{ ok: true; promo: ResolvedCheckoutPromo } | { ok: false; message: string }> {
  const normalizedEmail = normalizeEmail(params.email);

  if (params.premiumInviteToken?.trim()) {
    const invite = await getAdminPremiumInviteByToken(params.premiumInviteToken.trim());
    if (!invite) return { ok: false, message: "This invite link is not valid." };

    const effectiveStatus = resolvePremiumInviteStatus(invite);
    if (effectiveStatus === "redeemed") {
      return { ok: false, message: "This invite has already been used." };
    }
    if (effectiveStatus === "expired") {
      return { ok: false, message: "This invite link has expired." };
    }
    if (effectiveStatus === "revoked") {
      return { ok: false, message: "This invite is no longer active." };
    }
    if (normalizeEmail(invite.pupil_email) !== normalizedEmail) {
      return {
        ok: false,
        message: "Sign in with the email address this invite was sent to.",
      };
    }

    if (!invite.promo_code_id) {
      return { ok: false, message: "This invite is missing a promo code. Contact support." };
    }

    const promo = await getAdminPromoCodeById(invite.promo_code_id);
    if (!promo || !isPromoCodeUsable(promo)) {
      return { ok: false, message: "The discount on this invite is no longer available." };
    }

    return {
      ok: true,
      promo: {
        promoCodeId: promo.id,
        stripePromotionCodeId: promo.stripe_promotion_code_id,
        inviteId: invite.id,
        discountPercent: promo.discount_percent,
        code: promo.code,
      },
    };
  }

  const code = params.promoCode?.trim();
  if (!code) {
    return { ok: false, message: "No promo code provided." };
  }

  const promo = await getAdminPromoCodeByCode(code);
  if (!promo) return { ok: false, message: "Promo code not found." };
  if (!isPromoCodeUsable(promo)) {
    return { ok: false, message: "This promo code is expired or no longer available." };
  }

  return {
    ok: true,
    promo: {
      promoCodeId: promo.id,
      stripePromotionCodeId: promo.stripe_promotion_code_id,
      discountPercent: promo.discount_percent,
      code: promo.code,
    },
  };
}
