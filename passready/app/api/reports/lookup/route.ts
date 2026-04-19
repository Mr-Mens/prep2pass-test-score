import { NextResponse } from "next/server";

import { getReportSummaryByEmail } from "@/lib/server/repositories/reports-repository";
import { reportsLookupRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  return jsonError(405, "METHOD_NOT_ALLOWED", "Only POST is supported");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError(400, "INVALID_JSON", "Request body must be valid JSON");

    const parsed = reportsLookupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Lookup request failed validation");
    }

    const reports = await getReportSummaryByEmail(parsed.data.email.toLowerCase());
    return NextResponse.json({ success: true as const, reports });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to lookup reports right now");
  }
}
