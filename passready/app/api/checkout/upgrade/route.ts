import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { normalizeEmail } from "@/lib/normalize-email";
import { getLifetimeAccess } from "@/lib/server/repositories/entitlements-repository";
import { createCheckoutSession } from "@/lib/server/stripe";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { upgradeCheckoutRequestSchema } from "@/lib/validation";

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

    const parsed = upgradeCheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Upgrade payload failed validation");
    }

    const email = normalizeEmail(parsed.data.email);

    if (isSupabaseConfigured()) {
      const already = await getLifetimeAccess(email);
      if (already) {
        return NextResponse.json({ success: true as const, alreadyHasLifetime: true as const });
      }
    }

    const session = await createCheckoutSession({
      assessmentId: randomUUID(),
      email,
      weakAreaCount: 0,
      tier: "lifetime",
      flowMode: "upgrade",
    });

    if (!session.url || !session.id) {
      return jsonError(500, "STRIPE_SESSION_ERROR", "Could not create upgrade checkout session");
    }

    return NextResponse.json({
      success: true as const,
      alreadyHasLifetime: false as const,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[checkout:upgrade] stripe_error", {
        type: error.type,
        code: error.code,
        message: error.message,
      });
      return jsonError(500, "STRIPE_SESSION_ERROR", "Upgrade checkout is temporarily unavailable.");
    }
    if (error instanceof Error) {
      console.error("[checkout:upgrade] error", { message: error.message });
      if (
        error.message.includes("STRIPE_PRICE_ID") ||
        error.message.includes("STRIPE_SECRET_KEY")
      ) {
        return jsonError(500, "CHECKOUT_CONFIG_ERROR", "Upgrade checkout is temporarily unavailable.");
      }
    }
    return jsonError(500, "INTERNAL_ERROR", "Unable to start upgrade right now");
  }
}
