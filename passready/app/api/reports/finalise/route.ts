import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { normalizeEmail } from "@/lib/normalize-email";
import { verifyLifetimeFinaliseToken } from "@/lib/server/entitlement-token";
import { setLifetimeAccess, getLifetimeAccess } from "@/lib/server/repositories/entitlements-repository";
import {
  fromCheckoutSessionToPaymentInput,
  upsertPaymentFromCheckoutSession,
} from "@/lib/server/repositories/payments-repository";
import { createReport, getReportByStripeSessionId } from "@/lib/server/repositories/reports-repository";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { retrieveCheckoutSession } from "@/lib/server/stripe";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { scoreAssessment } from "@/lib/services/assessment-service";
import type { AssessmentPayload, ReportDbRecord } from "@/lib/validation";
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

function buildExistingReportResponse(
  sessionId: string,
  existing: ReportDbRecord,
  assessment: AssessmentPayload,
) {
  return {
    success: true as const,
    sessionId,
    reportId: existing.id,
    assessment,
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
  };
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

    const { assessment } = parsed.data;
    const supabaseOk = isSupabaseConfigured();
    const skipDbPersist = !supabaseOk && allowPersistSkipWithoutSupabase();

    if (!supabaseOk && !skipDbPersist) {
      return jsonError(
        503,
        "SERVICE_UNAVAILABLE",
        "Report storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or set SKIP_SUPABASE_REPORT_PERSIST=true for local-only testing.",
      );
    }

    if (parsed.data.sessionId) {
      return await finaliseWithStripeSession(parsed.data.sessionId, assessment, supabaseOk, skipDbPersist);
    }

    return await finaliseWithEntitlementToken(
      parsed.data.entitlementToken!,
      assessment,
      supabaseOk,
      skipDbPersist,
    );
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

async function finaliseWithStripeSession(
  sessionId: string,
  assessment: AssessmentPayload,
  supabaseOk: boolean,
  skipDbPersist: boolean,
) {
  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status !== "paid") {
    return jsonError(402, "PAYMENT_REQUIRED", "Payment is not confirmed");
  }

  const emailFromStripe = session.customer_email
    ? normalizeEmail(session.customer_email)
    : session.customer_details?.email
      ? normalizeEmail(session.customer_details.email)
      : null;
  if (emailFromStripe && emailFromStripe !== assessment.email) {
    return jsonError(403, "EMAIL_MISMATCH", "This checkout session does not match this assessment email.");
  }

  if (supabaseOk) {
    const tier = session.metadata?.tier;
    if (tier === "lifetime" && emailFromStripe) {
      try {
        await setLifetimeAccess(emailFromStripe);
      } catch (e) {
        console.error("[reports:finalise] set_lifetime_failed", e);
      }
    }

    const existing = await getReportByStripeSessionId(session.id);
    if (existing) {
      return NextResponse.json(buildExistingReportResponse(session.id, existing, assessment));
    }
  }

  const { assessment: scoredAssessment, result } = await scoreAssessment(assessment);

  if (skipDbPersist) {
    console.warn(
      "[reports:finalise] skipping_db_persist: no Supabase config. Report exists in-app only until you add Supabase.",
    );
    return NextResponse.json({
      success: true as const,
      sessionId: session.id,
      reportId: randomUUID(),
      assessment: scoredAssessment,
      result,
    });
  }

  await upsertPaymentFromCheckoutSession(fromCheckoutSessionToPaymentInput(session));
  const report = await createReport({
    stripeSessionId: session.id,
    paymentStatus: session.payment_status ?? "paid",
    assessment: scoredAssessment,
    result,
  });

  return NextResponse.json({
    success: true as const,
    sessionId: session.id,
    reportId: report.id,
    assessment: scoredAssessment,
    result,
  });
}

async function finaliseWithEntitlementToken(
  entitlementToken: string,
  assessment: AssessmentPayload,
  supabaseOk: boolean,
  skipDbPersist: boolean,
) {
  const payload = verifyLifetimeFinaliseToken(entitlementToken);
  if (!payload) {
    return jsonError(401, "INVALID_ENTITLEMENT", "Your session expired. Start checkout again from the assessment.");
  }

  if (payload.email !== assessment.email) {
    return jsonError(403, "EMAIL_MISMATCH", "This unlock link does not match this assessment email.");
  }

  if (supabaseOk) {
    const ok = await getLifetimeAccess(assessment.email);
    if (!ok) {
      return jsonError(403, "LIFETIME_REQUIRED", "Lifetime access is not active for this email.");
    }
  } else if (!skipDbPersist) {
    return jsonError(
      503,
      "SERVICE_UNAVAILABLE",
      "Report storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or set SKIP_SUPABASE_REPORT_PERSIST=true for local-only testing.",
    );
  }

  const syntheticSessionId = `lifetime:${randomUUID()}`;

  const { assessment: scoredAssessment, result } = await scoreAssessment(assessment);

  if (skipDbPersist) {
    console.warn("[reports:finalise] entitlement skipping_db_persist");
    return NextResponse.json({
      success: true as const,
      sessionId: syntheticSessionId,
      reportId: randomUUID(),
      assessment: scoredAssessment,
      result,
    });
  }

  const report = await createReport({
    stripeSessionId: syntheticSessionId,
    paymentStatus: "paid",
    assessment: scoredAssessment,
    result,
  });

  return NextResponse.json({
    success: true as const,
    sessionId: syntheticSessionId,
    reportId: report.id,
    assessment: scoredAssessment,
    result,
  });
}
