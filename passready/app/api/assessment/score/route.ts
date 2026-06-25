import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/normalize-email";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { recordFreeAssessmentUsed } from "@/lib/server/repositories/entitlements-repository";
import { scoreAssessment } from "@/lib/services/assessment-service";
import { assessmentDataSchema } from "@/lib/validation";

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

    const parsed = assessmentDataSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[assessment:score] validation_failed", parsed.error.flatten());
      return jsonError(400, "VALIDATION_ERROR", "Assessment payload failed validation");
    }

    const assessmentEmail = normalizeEmail(parsed.data.email);
    if (assessmentEmail !== auth.email) {
      return jsonError(403, "EMAIL_MISMATCH", "Your assessment email must match your Pass Pilot account.");
    }

    const access = await getLearnerAccessStatus(auth.userId);
    if (!access.canStartAssessment) {
      if (access.isGraduated) {
        return jsonError(
          403,
          "GRADUATED",
          "Congratulations, your account is in Graduate Mode. New assessments are disabled.",
        );
      }
      return jsonError(
        403,
        "FREE_ASSESSMENT_USED",
        "You have already used your free assessment. Start your 7-day Premium trial to unlock unlimited assessments.",
      );
    }

    const { assessment, result } = await scoreAssessment(parsed.data, {
      useAiEnrichment: false,
      userId: auth.userId,
    });

    if (!access.hasPremiumAccess) {
      try {
        await recordFreeAssessmentUsed({
          userId: auth.userId,
          score: result.readinessScore,
          label: result.readinessLabel,
          assessmentData: parsed.data as Record<string, unknown>,
        });
      } catch (recordError) {
        console.error("[assessment:score] record_free_assessment_failed", recordError);
      }
    }

    return NextResponse.json({
      success: true as const,
      assessment,
      result,
    });
  } catch (error) {
    console.error("[assessment:score] failed", error);
    return jsonError(500, "INTERNAL_ERROR", "Unable to score assessment right now");
  }
}
