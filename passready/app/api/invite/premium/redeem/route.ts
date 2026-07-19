import { NextResponse } from "next/server";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import {
  premiumInviteSubscribePath,
  redeemPremiumInviteForUser,
} from "@/lib/server/redeem-premium-invite";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH_REQUIRED", auth.message);

  let token = "";
  try {
    const body = (await request.json()) as { token?: string };
    token = body.token?.trim() ?? "";
  } catch {
    return jsonError(400, "INVALID_BODY", "Invite token is required.");
  }
  if (!token) return jsonError(400, "INVALID_BODY", "Invite token is required.");

  try {
    const result = await redeemPremiumInviteForUser({
      token,
      userId: auth.userId,
      email: auth.email,
    });

    if (result.ok) {
      return NextResponse.json({
        success: true as const,
        kind: result.kind,
        redirect: "/dashboard?premium=gift",
      });
    }

    if (result.kind === "needs_checkout") {
      return NextResponse.json({
        success: false as const,
        error: { code: "NEEDS_CHECKOUT", message: result.message },
        redirect: premiumInviteSubscribePath(token),
        discountPercent: result.discountPercent,
      });
    }

    return jsonError(400, "REDEEM_FAILED", result.message);
  } catch (e) {
    console.error("[invite/premium/redeem] failed", e);
    return jsonError(500, "REDEEM_FAILED", "Could not activate this invite. Please try again.");
  }
}
