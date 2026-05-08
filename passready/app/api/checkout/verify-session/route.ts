import { NextResponse } from "next/server";
import Stripe from "stripe";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { retrieveCheckoutSession } from "@/lib/server/stripe";
import { verifyCheckoutSessionRequestSchema } from "@/lib/validation";

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

    const parsed = verifyCheckoutSessionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Session verification request is invalid");
    }

    const session = await retrieveCheckoutSession(parsed.data.sessionId);

    const ownerIdRaw = session.metadata?.supabase_user_id;
    const ownerId = typeof ownerIdRaw === "string" && ownerIdRaw.trim().length ? ownerIdRaw.trim() : null;

    if (!ownerId || ownerId !== auth.userId) {
      return jsonError(403, "CHECKOUT_OWNERSHIP", "This checkout is not tied to your account.");
    }

    const paid = session.payment_status === "paid";

    return NextResponse.json({
      success: true as const,
      paid,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return jsonError(502, "STRIPE_ERROR", "Unable to verify payment with Stripe.");
    }
    return jsonError(500, "INTERNAL_ERROR", "Unable to verify checkout session");
  }
}
