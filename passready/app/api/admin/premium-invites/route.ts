import { NextResponse } from "next/server";
import { z } from "zod";

import { createStripePromoForDiscount } from "@/lib/server/admin-promo-stripe";
import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import { getStripeConfig } from "@/lib/server/stripe";
import {
  generateAutoPromoCode,
  generatePremiumInviteToken,
  getAdminPromoCodeById,
  insertAdminPremiumInvite,
  insertAdminPromoCode,
  isPromoCodeUsable,
  listAdminPremiumInvites,
} from "@/lib/server/repositories/admin-promo-repository";
import { normalizeEmail } from "@/lib/normalize-email";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

const createInviteSchema = z.object({
  pupilEmail: z.string().email(),
  discountPercent: z.union([
    z.literal(10),
    z.literal(20),
    z.literal(30),
    z.literal(40),
    z.literal(50),
    z.literal(60),
    z.literal(70),
    z.literal(80),
    z.literal(90),
    z.literal(100),
  ]),
  promoCodeId: z.string().uuid().optional(),
  note: z.string().trim().max(240).optional(),
  expiresInDays: z.number().int().min(1).max(365).default(30),
});

export async function GET(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonError(401, "UNAUTHORIZED", gate.message);

  try {
    const invites = await listAdminPremiumInvites();
    const appUrl = getStripeConfig().appUrl;
    return NextResponse.json({
      success: true as const,
      invites: invites.map((i) => ({
        id: i.id,
        token: i.token,
        pupilEmail: i.pupil_email,
        discountPercent: i.discount_percent,
        promoCode: i.promo_code,
        status: i.status,
        expiresAt: i.expires_at,
        redeemedAt: i.redeemed_at,
        note: i.note,
        createdAt: i.created_at,
        inviteUrl: `${appUrl}/invite/premium/${i.token}`,
      })),
    });
  } catch (e) {
    console.error("[admin:premium-invites:GET]", e);
    return jsonError(500, "LIST_FAILED", "Could not load premium invites.");
  }
}

export async function POST(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonError(401, "UNAUTHORIZED", gate.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid payload");
  }

  const pupilEmail = normalizeEmail(parsed.data.pupilEmail);
  const token = generatePremiumInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

  try {
    let promoCodeId = parsed.data.promoCodeId ?? null;

    if (promoCodeId) {
      const existing = await getAdminPromoCodeById(promoCodeId);
      if (!existing || !isPromoCodeUsable(existing)) {
        return jsonError(400, "INVALID_PROMO", "Selected promo code is not available.");
      }
      if (existing.discount_percent !== parsed.data.discountPercent) {
        return jsonError(400, "DISCOUNT_MISMATCH", "Selected promo code discount does not match.");
      }
    } else {
      const inviteCode = generateAutoPromoCode(parsed.data.discountPercent, "GIFT");
      const stripePromo = await createStripePromoForDiscount({
        code: inviteCode,
        discountPercent: parsed.data.discountPercent,
        maxRedemptions: 1,
        expiresAt,
      });
      const promoRow = await insertAdminPromoCode({
        code: stripePromo.code,
        label: `Invite for ${pupilEmail}`,
        discountPercent: parsed.data.discountPercent,
        stripeCouponId: stripePromo.stripeCouponId,
        stripePromotionCodeId: stripePromo.stripePromotionCodeId,
        maxRedemptions: 1,
        expiresAt,
      });
      promoCodeId = promoRow.id;
    }

    const invite = await insertAdminPremiumInvite({
      token,
      pupilEmail,
      promoCodeId,
      discountPercent: parsed.data.discountPercent,
      expiresAt,
      note: parsed.data.note ?? null,
    });

    const appUrl = getStripeConfig().appUrl;
    const inviteUrl = `${appUrl}/invite/premium/${token}`;

    return NextResponse.json({
      success: true as const,
      invite: {
        id: invite.id,
        token: invite.token,
        pupilEmail: invite.pupil_email,
        discountPercent: invite.discount_percent,
        status: invite.status,
        expiresAt: invite.expires_at,
        inviteUrl,
      },
    });
  } catch (e) {
    console.error("[admin:premium-invites:POST]", e);
    return jsonError(500, "CREATE_FAILED", "Could not create premium invite.");
  }
}
