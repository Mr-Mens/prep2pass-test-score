import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/normalize-email";
import { setLifetimeAccess } from "@/lib/server/repositories/entitlements-repository";
import { retrieveCheckoutSession } from "@/lib/server/stripe";
import { isSupabaseConfigured } from "@/lib/server/supabase";
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

    const session = await retrieveCheckoutSession(parsed.data.sessionId);
    if (session.payment_status !== "paid") {
      return jsonError(402, "PAYMENT_REQUIRED", "Payment is not confirmed");
    }
    if (session.metadata?.tier !== "lifetime" || session.metadata?.upgradeOnly !== "true") {
      return jsonError(400, "NOT_AN_UPGRADE", "This checkout is not a lifetime upgrade.");
    }

    const emailRaw = session.customer_email ?? session.customer_details?.email ?? null;
    if (!emailRaw) {
      return jsonError(400, "MISSING_EMAIL", "Checkout session is missing customer email.");
    }
    const email = normalizeEmail(emailRaw);

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true as const, hasLifetimeAccess: true as const, email });
    }

    await setLifetimeAccess(email);
    return NextResponse.json({ success: true as const, hasLifetimeAccess: true as const, email });
  } catch (e) {
    console.error("[entitlements:confirm-upgrade]", e);
    return jsonError(500, "INTERNAL_ERROR", "Could not confirm upgrade");
  }
}
