import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { retrieveCheckoutSession } from "@/lib/server/stripe";
import { isSupabaseConfigured } from "@/lib/server/supabase";
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

/** When Supabase is missing, allow completing checkout locally without persisting reports. */
function allowPersistSkipWithoutSupabase(): boolean {
  return (
    process.env.NODE_ENV === "development" || process.env.SKIP_SUPABASE_REPORT_PERSIST === "true"
  );
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

    const supabaseOk = isSupabaseConfigured();
    const skipDbPersist = !supabaseOk && allowPersistSkipWithoutSupabase();

    if (!supabaseOk && !skipDbPersist) {
      return jsonError(
        503,
        "SERVICE_UNAVAILABLE",
        "Report storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or set SKIP_SUPABASE_REPORT_PERSIST=true for local-only testing.",
      );
    }

    if (supabaseOk) {
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
    }

    const { assessment, result } = await scoreAssessment(parsed.data.assessment);

    if (skipDbPersist) {
      console.warn(
        "[reports:finalise] skipping_db_persist: no Supabase config. Report exists in-app only until you add Supabase.",
      );
      return NextResponse.json({
        success: true as const,
        sessionId: session.id,
        reportId: randomUUID(),
        assessment,
        result,
      });
    }

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
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[reports:finalise] stripe_error", {
        type: error.type,
        code: error.code,
        message: error.message,
      });
      return jsonError(502, "STRIPE_ERROR", "Could not verify payment with Stripe.");
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error("[reports:finalise] error", { message });

    if (message.includes("is not configured")) {
      return jsonError(
        503,
        "SERVICE_UNAVAILABLE",
        "Report storage is not configured. Add Supabase URL and service role key, then try again.",
      );
    }

    if (
      message.includes("Failed to upsert payment") ||
      message.includes("Failed to create report") ||
      message.includes("Failed to fetch report")
    ) {
      return jsonError(
        503,
        "DATABASE_ERROR",
        "Could not read or save your report in Supabase. Confirm `reports` exists (see supabase/schema.sql), URL and service role key are correct, and check server logs for the Postgres/PostgREST error.",
      );
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to finalise report right now");
  }
}
