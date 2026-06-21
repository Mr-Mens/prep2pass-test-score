import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/normalize-email";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { setLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
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

function stripeOwnerUserId(session: { metadata?: Record<string, string | null> | null }): string | null {
  const raw = session.metadata?.supabase_user_id;
  return typeof raw === "string" && raw.trim().length ? raw.trim() : null;
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

    const session = await retrieveCheckoutSession(parsed.data.sessionId);
    if (session.payment_status !== "paid") {
      return jsonError(402, "PAYMENT_REQUIRED", "Payment is not confirmed");
    }
    if (session.metadata?.tier !== "lifetime" || session.metadata?.upgradeOnly !== "true") {
      return jsonError(400, "NOT_AN_UPGRADE", "This checkout is not a lifetime upgrade.");
    }

    const ownerId = stripeOwnerUserId(session);
    if (!ownerId || ownerId !== auth.userId) {
      return jsonError(403, "CHECKOUT_OWNERSHIP", "This upgrade checkout is not tied to your account.");
    }

    const emailRaw = session.customer_email ?? session.customer_details?.email ?? null;
    if (!emailRaw) {
      return jsonError(400, "MISSING_EMAIL", "Checkout session is missing customer email.");
    }
    const email = normalizeEmail(emailRaw);
    if (email !== auth.email) {
      return jsonError(403, "EMAIL_MISMATCH", "The Stripe email does not match your Pass Pilot account.");
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true as const, hasLifetimeAccess: true as const });
    }

    await setLifetimeAccessByUserId(auth.userId);
    return NextResponse.json({ success: true as const, hasLifetimeAccess: true as const });
  } catch (e) {
    console.error("[entitlements:confirm-upgrade]", e);
    return jsonError(500, "INTERNAL_ERROR", "Could not confirm upgrade");
  }
}
