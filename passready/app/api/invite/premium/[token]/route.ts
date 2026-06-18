import { NextResponse } from "next/server";

import { formatDiscountLabel } from "@/lib/admin/promo-discounts";
import {
  getAdminPremiumInviteByToken,
  resolvePremiumInviteStatus,
} from "@/lib/server/repositories/admin-promo-repository";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!token?.trim()) return jsonError(400, "INVALID_TOKEN", "Invite token is required.");

  try {
    const invite = await getAdminPremiumInviteByToken(token.trim());
    if (!invite) return jsonError(404, "NOT_FOUND", "This invite link is not valid.");

    const status = resolvePremiumInviteStatus(invite);

    return NextResponse.json({
      success: true as const,
      invite: {
        pupilEmail: invite.pupil_email,
        discountPercent: invite.discount_percent,
        discountLabel: formatDiscountLabel(invite.discount_percent),
        promoCode: invite.promo_code,
        status,
        expiresAt: invite.expires_at,
        redeemedAt: invite.redeemed_at,
      },
    });
  } catch (e) {
    console.error("[invite:premium:GET]", e);
    return jsonError(500, "READ_FAILED", "Could not load invite.");
  }
}
