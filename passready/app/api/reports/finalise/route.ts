import { NextResponse } from "next/server";

import { retrieveCheckoutSession } from "@/lib/server/stripe";
import {
  fromCheckoutSessionToPaymentInput,
  upsertPaymentFromCheckoutSession,
} from "@/lib/server/repositories/payments-repository";
import { createReport, getReportByStripeSessionId } from "@/lib/server/repositories/reports-repository";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { scoreAssessment } from "@/lib/services/assessment-service";
import { finaliseReportRequestSchema } from "@/lib/validation";

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

    const parsed = finaliseReportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Finalise payload failed validation");
    }

    const session = await retrieveCheckoutSession(parsed.data.sessionId);
    if (session.payment_status !== "paid") {
      return jsonError(402, "PAYMENT_REQUIRED", "Payment is not confirmed");
    }

    const existing = await getReportByStripeSessionId(session.id);
    if (existing) {
      return NextResponse.json({
        success: true as const,
        sessionId: session.id,
        reportId: existing.id,
        assessment: parsed.data.assessment,
        result: {
          readinessScore: existing.readiness_score,
          readinessLabel: existing.readiness_label,
          summary: existing.summary,
          riskAreas: normalizeGroupedRiskAreas(existing.risk_areas),
          nextSteps: existing.next_steps,
          recommendedHours: existing.recommended_hours,
          coachMessage: existing.coach_message,
          metadata: {
            source: existing.report_source === "ai" ? "ai" : "fallback",
            model: existing.model_name ?? undefined,
            generatedAt: existing.generated_at,
          },
        },
      });
    }

    const { assessment, result } = await scoreAssessment(parsed.data.assessment);
    await upsertPaymentFromCheckoutSession(fromCheckoutSessionToPaymentInput(session));
    const report = await createReport({
      stripeSessionId: session.id,
      paymentStatus: session.payment_status ?? "paid",
      assessment,
      result,
    });

    return NextResponse.json({
      success: true as const,
      sessionId: session.id,
      reportId: report.id,
      assessment,
      result,
    });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to finalise report right now");
  }
}
