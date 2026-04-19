import { NextResponse } from "next/server";

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
    const paid = session.payment_status === "paid";

    return NextResponse.json({
      success: true as const,
      paid,
      sessionId: session.id,
    });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to verify checkout session");
  }
}
