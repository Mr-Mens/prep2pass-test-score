import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/normalize-email";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
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
      return jsonError(400, "VALIDATION_ERROR", "Assessment payload failed validation");
    }

    const assessmentEmail = normalizeEmail(parsed.data.email);
    if (assessmentEmail !== auth.email) {
      return jsonError(403, "EMAIL_MISMATCH", "Your assessment email must match your Pass Pilot account.");
    }

    const { canLearnerStartAssessment } = await import("@/lib/server/effective-lifetime-access");
    const canStart = await canLearnerStartAssessment(auth.userId);
    if (!canStart) {
      return jsonError(403, "GRADUATED", "Congratulations, your account is in Graduate Mode. New assessments are disabled.");
    }

    const { assessment, result } = await scoreAssessment(parsed.data, {
      useAiEnrichment: false,
      userId: auth.userId,
    });

    return NextResponse.json({
      success: true as const,
      assessment,
      result,
    });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to score assessment right now");
  }
}
