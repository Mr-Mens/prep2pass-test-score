import { NextResponse } from "next/server";

import { EmailNotConfiguredError } from "@/lib/email/resend";
import { sendPremiumInviteEmail } from "@/lib/email/templates/premium-invite";
import { handleAdminPromoRouteError, jsonAdminError } from "@/lib/server/admin-promo-route-errors";
import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import { getStripeConfig } from "@/lib/server/stripe";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import {
  getAdminPremiumInviteByToken,
  listAdminPremiumInvites,
  resolvePremiumInviteStatus,
} from "@/lib/server/repositories/admin-promo-repository";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonAdminError(401, "UNAUTHORIZED", gate.message);
  if (!isSupabaseConfigured()) {
    return jsonAdminError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const { id } = await context.params;

  try {
    const invites = await listAdminPremiumInvites();
    const invite = invites.find((row) => row.id === id) ?? null;
    if (!invite) return jsonAdminError(404, "NOT_FOUND", "Invite not found.");

    const status = resolvePremiumInviteStatus(invite);
    if (status !== "pending") {
      return jsonAdminError(400, "NOT_PENDING", `This invite is ${status} and cannot be emailed.`);
    }

    // Ensure token still resolves (defensive).
    const fresh = await getAdminPremiumInviteByToken(invite.token);
    if (!fresh) return jsonAdminError(404, "NOT_FOUND", "Invite not found.");

    await sendPremiumInviteEmail({
      toEmail: invite.pupil_email,
      inviteToken: invite.token,
      discountPercent: invite.discount_percent,
      expiresAt: invite.expires_at,
    });

    const appUrl = getStripeConfig().appUrl;
    return NextResponse.json({
      success: true as const,
      emailSent: true,
      inviteUrl: `${appUrl}/invite/premium/${invite.token}`,
    });
  } catch (e) {
    if (e instanceof EmailNotConfiguredError) {
      return jsonAdminError(503, "EMAIL_NOT_CONFIGURED", "Email is not configured on the server.");
    }
    return handleAdminPromoRouteError(e, "Could not send invite email.");
  }
}
