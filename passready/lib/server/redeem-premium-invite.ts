import "server-only";

import { normalizeEmail } from "@/lib/normalize-email";
import {
  getAdminPremiumInviteByToken,
  markAdminPremiumInviteRedeemed,
  recordPromotionRedemption,
  resolvePremiumInviteStatus,
} from "@/lib/server/repositories/admin-promo-repository";
import {
  getSubscriptionByUserId,
  grantGiftPremiumSubscription,
  subscriptionGrantsPremium,
} from "@/lib/server/repositories/subscriptions-repository";

export type RedeemPremiumInviteResult =
  | { ok: true; kind: "gift_activated" | "already_premium" }
  | { ok: false; kind: "needs_checkout"; discountPercent: number; message: string }
  | { ok: false; kind: "error"; message: string };

/** Extract invite token from continue URL, claim path, or signup metadata. */
export function extractPremiumInviteToken(
  continueRaw: string | null | undefined,
  metadata?: Record<string, unknown> | null,
): string | null {
  const fromMeta =
    typeof metadata?.pending_premium_invite_token === "string"
      ? metadata.pending_premium_invite_token.trim()
      : "";
  if (fromMeta) return fromMeta;

  if (typeof continueRaw !== "string" || !continueRaw.startsWith("/") || continueRaw.startsWith("//")) {
    return null;
  }

  const claimMatch = continueRaw.match(/^\/invite\/premium\/([^/?#]+)(?:\/claim)?(?:\?|$)/);
  if (claimMatch?.[1]) return decodeURIComponent(claimMatch[1]);

  try {
    const url = new URL(continueRaw, "http://passpilot.local");
    const fromQuery = url.searchParams.get("premiumInvite")?.trim();
    if (fromQuery) return fromQuery;
  } catch {
    /* ignore */
  }

  return null;
}

export function premiumInviteClaimPath(token: string): string {
  return `/invite/premium/${encodeURIComponent(token)}/claim`;
}

export function premiumInviteSubscribePath(token: string): string {
  return `/subscribe?premiumInvite=${encodeURIComponent(token)}`;
}

/**
 * Redeem a 100% premium invite without Stripe.
 * Partial discounts return needs_checkout so the client can open Subscribe.
 */
export async function redeemPremiumInviteForUser(input: {
  token: string;
  userId: string;
  email: string;
}): Promise<RedeemPremiumInviteResult> {
  const token = input.token.trim();
  if (!token) return { ok: false, kind: "error", message: "Invite token is missing." };

  const invite = await getAdminPremiumInviteByToken(token);
  if (!invite) return { ok: false, kind: "error", message: "This invite link is not valid." };

  const status = resolvePremiumInviteStatus(invite);
  if (status === "redeemed") {
    const existing = await getSubscriptionByUserId(input.userId);
    if (existing && subscriptionGrantsPremium(existing.status)) {
      return { ok: true, kind: "already_premium" };
    }
    return { ok: false, kind: "error", message: "This invite has already been used." };
  }
  if (status === "expired") {
    return { ok: false, kind: "error", message: "This invite link has expired." };
  }
  if (status === "revoked") {
    return { ok: false, kind: "error", message: "This invite is no longer active." };
  }

  if (normalizeEmail(invite.pupil_email) !== normalizeEmail(input.email)) {
    return {
      ok: false,
      kind: "error",
      message: "Sign in with the email address this invite was sent to.",
    };
  }

  const existing = await getSubscriptionByUserId(input.userId);
  if (existing && subscriptionGrantsPremium(existing.status)) {
    await markAdminPremiumInviteRedeemed(invite.id, input.userId);
    return { ok: true, kind: "already_premium" };
  }

  if (invite.discount_percent < 100) {
    return {
      ok: false,
      kind: "needs_checkout",
      discountPercent: invite.discount_percent,
      message: "Complete checkout to claim this premium discount.",
    };
  }

  const giftKey = `gift_${invite.id}`;
  await grantGiftPremiumSubscription({
    userId: input.userId,
    giftSubscriptionId: giftKey,
    adminPromoCodeId: invite.promo_code_id,
  });

  if (invite.promo_code_id) {
    await recordPromotionRedemption({
      promoCodeId: invite.promo_code_id,
      userId: input.userId,
      promotionType: "discount",
      stripeSubscriptionId: giftKey,
    });
  }

  await markAdminPremiumInviteRedeemed(invite.id, input.userId);

  return { ok: true, kind: "gift_activated" };
}
