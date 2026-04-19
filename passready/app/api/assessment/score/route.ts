import { NextResponse } from "next/server";

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

    const { assessment, result } = await scoreAssessment(parsed.data);

    return NextResponse.json({
      success: true as const,
      assessment,
      result,
    });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to score assessment right now");
  }
}
