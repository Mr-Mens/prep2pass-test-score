import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { normalizeEmail } from "@/lib/normalize-email";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { verifyLifetimeFinaliseToken } from "@/lib/server/entitlement-token";
import { getEffectiveLifetimeAccessByUserId } from "@/lib/server/effective-lifetime-access";
import { setLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
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

function stripeMetadataUserId(session: Stripe.Checkout.Session): string | null {
  const raw = session.metadata?.supabase_user_id;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

function allowPersistSkipWithoutSupabase(): boolean {
  return process.env.NODE_ENV === "development" || process.env.SKIP_SUPABASE_REPORT_PERSIST === "true";
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
    persisted: true as const,
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

    const parsed = finaliseReportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Finalise payload failed validation");
    }

    const { assessment } = parsed.data;

    const assessmentEmail = normalizeEmail(assessment.email);
    if (assessmentEmail !== auth.email) {
      return jsonError(403, "EMAIL_MISMATCH", "Your assessment email must match your signed-in Pass Pilot account.");
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

    if (parsed.data.sessionId) {
      return await finaliseWithStripeSession(
        parsed.data.sessionId,
        assessment,
        supabaseOk,
        skipDbPersist,
        auth.userId,
        auth.email,
      );
    }

    return await finaliseWithEntitlementToken(parsed.data.entitlementToken!, assessment, supabaseOk, skipDbPersist, {
      userId: auth.userId,
      email: auth.email,
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
        "Could not read or save your report in Supabase. Confirm tables exist (see supabase/), URL and service role key are correct, then check server logs.",
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
  userId: string,
  userEmailNormalized: string,
) {
  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status !== "paid") {
    return jsonError(402, "PAYMENT_REQUIRED", "Payment is not confirmed");
  }

  const ownerId = stripeMetadataUserId(session);
  if (!ownerId || ownerId !== userId) {
    return jsonError(403, "CHECKOUT_OWNERSHIP", "This checkout is not tied to your account.");
  }

  const emailFromStripe = session.customer_email
    ? normalizeEmail(session.customer_email)
    : session.customer_details?.email
      ? normalizeEmail(session.customer_details.email)
      : null;
  if (emailFromStripe && emailFromStripe !== userEmailNormalized) {
    return jsonError(
      403,
      "EMAIL_MISMATCH",
      "The email on your Stripe checkout does not match your signed-in Pass Pilot account.",
    );
  }

  if (supabaseOk) {
    const tier = session.metadata?.tier;
    if (tier === "lifetime") {
      try {
        await setLifetimeAccessByUserId(userId);
      } catch (e) {
        console.error("[reports:finalise] set_lifetime_failed", e);
      }
    }

    const existing = await getReportByStripeSessionId(session.id);
    if (existing) {
      const okOwnership = existing.user_id
        ? existing.user_id === userId
        : normalizeEmail(existing.email) === userEmailNormalized;
      if (!okOwnership) {
        return jsonError(403, "REPORT_OWNERSHIP", "This report belongs to another account.");
      }
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
      persisted: false as const,
      assessment: scoredAssessment,
      result,
    });
  }

  await upsertPaymentFromCheckoutSession(fromCheckoutSessionToPaymentInput(session));
  const report = await createReport({
    userId,
    stripeSessionId: session.id,
    paymentStatus: session.payment_status ?? "paid",
    assessment: scoredAssessment,
    result,
  });

  return NextResponse.json({
    success: true as const,
    sessionId: session.id,
    reportId: report.id,
    persisted: true as const,
    assessment: scoredAssessment,
    result,
  });
}

async function finaliseWithEntitlementToken(
  entitlementToken: string,
  assessment: AssessmentPayload,
  supabaseOk: boolean,
  skipDbPersist: boolean,
  caller: { userId: string; email: string },
) {
  const payload = verifyLifetimeFinaliseToken(entitlementToken);
  if (!payload) {
    return jsonError(401, "INVALID_ENTITLEMENT", "Your session expired. Complete checkout again.");
  }

  if (payload.email !== caller.email || payload.userId !== caller.userId) {
    return jsonError(403, "ENTITLEMENT_MISMATCH", "This unlock does not belong to your account.");
  }

  if (supabaseOk) {
    const ok = await getEffectiveLifetimeAccessByUserId(caller.userId);
    if (!ok) {
      return jsonError(403, "LIFETIME_REQUIRED", "Lifetime access is not active for your account.");
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
      persisted: false as const,
      assessment: scoredAssessment,
      result,
    });
  }

  const report = await createReport({
    userId: caller.userId,
    stripeSessionId: syntheticSessionId,
    paymentStatus: "paid",
    assessment: scoredAssessment,
    result,
  });

  return NextResponse.json({
    success: true as const,
    sessionId: syntheticSessionId,
    reportId: report.id,
    persisted: true as const,
    assessment: scoredAssessment,
    result,
  });
}
