import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

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
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to start checkout right now");
  }
}
