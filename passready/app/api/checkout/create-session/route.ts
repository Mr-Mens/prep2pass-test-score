import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { normalizeEmail } from "@/lib/normalize-email";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { signLifetimeFinaliseToken } from "@/lib/server/entitlement-token";
import { getEffectiveLifetimeAccessByUserId } from "@/lib/server/effective-lifetime-access";
import { createCheckoutSession } from "@/lib/server/stripe";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { createCheckoutSessionRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  return jsonError(405, "METHOD_NOT_ALLOWED", "Only POST is supported");
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

    const parsed = createCheckoutSessionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Checkout payload failed validation");
    }

    const assessmentEmail = normalizeEmail(parsed.data.assessment.email);
    if (assessmentEmail !== normalizeEmail(auth.email)) {
      return jsonError(403, "EMAIL_MISMATCH", "Your assessment email must match your Pass Pilot account.");
    }

    const supabaseOk = isSupabaseConfigured();

    if (supabaseOk) {
      let lifetime = false;
      try {
        lifetime = await getEffectiveLifetimeAccessByUserId(auth.userId);
      } catch (e) {
        console.error("[checkout:create-session] lifetime_read_failed", e);
        return jsonError(
          503,
          "ENTITLEMENT_READ_FAILED",
          "We could not confirm your account access. Please try again shortly.",
        );
      }
      if (lifetime) {
        try {
          const entitlementToken = signLifetimeFinaliseToken(auth.email, auth.userId);
          return NextResponse.json({
            success: true as const,
            skipCheckout: true as const,
            entitlementToken,
          });
        } catch (e) {
          console.error("[checkout:create-session] entitlement_token_failed", e);
          return jsonError(
            503,
            "ENTITLEMENT_CONFIG_ERROR",
            "Lifetime access is temporarily unavailable. Please try again shortly.",
          );
        }
      }
    }

    const assessmentId = randomUUID();
    const tier = parsed.data.tier ?? "subscription";
    const session = await createCheckoutSession({
      assessmentId,
      email: parsed.data.assessment.email,
      weakAreaCount: parsed.data.assessment.weakAreas.length,
      tier,
      userId: auth.userId,
    });

    if (!session.url || !session.id) {
      return jsonError(500, "STRIPE_SESSION_ERROR", "Could not create checkout session");
    }

    return NextResponse.json({
      success: true as const,
      skipCheckout: false as const,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      const code = error.code ?? "STRIPE_ERROR";
      const stripeType = error.type ?? "StripeError";
      console.error("[checkout:create-session] stripe_error", {
        type: stripeType,
        code,
        message: error.message,
      });
      const message =
        code === "resource_missing"
          ? "Checkout is temporarily unavailable, pricing is not configured correctly."
          : code === "authentication_error"
            ? "Checkout is temporarily unavailable, payment credentials are invalid."
            : "Checkout is temporarily unavailable. Please try again in a moment.";
      return jsonError(500, "STRIPE_SESSION_ERROR", message);
    }

    if (error instanceof Error) {
      console.error("[checkout:create-session] config_or_internal_error", { message: error.message });
      if (
        error.message.includes("STRIPE_PRICE_ID") ||
        error.message.includes("STRIPE_SECRET_KEY") ||
        error.message.includes("ENTITLEMENT_TOKEN_SECRET")
      ) {
        return jsonError(500, "CHECKOUT_CONFIG_ERROR", "Checkout is temporarily unavailable.");
      }
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to start checkout right now");
  }
}
