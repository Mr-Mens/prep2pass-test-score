import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createCheckoutSession } from "@/lib/server/stripe";
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

    const assessmentId = randomUUID();
    const session = await createCheckoutSession({
      assessmentId,
      email: parsed.data.assessment.email,
      weakAreaCount: parsed.data.assessment.weakAreas.length,
    });

    if (!session.url || !session.id) {
      return jsonError(500, "STRIPE_SESSION_ERROR", "Could not create checkout session");
    }

    return NextResponse.json({
      success: true as const,
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
      if (error.message.includes("STRIPE_PRICE_ID")) {
        return jsonError(500, "CHECKOUT_CONFIG_ERROR", "Checkout is temporarily unavailable.");
      }
      if (error.message.includes("STRIPE_SECRET_KEY")) {
        return jsonError(500, "CHECKOUT_CONFIG_ERROR", "Checkout is temporarily unavailable.");
      }
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to start checkout right now");
  }
}
