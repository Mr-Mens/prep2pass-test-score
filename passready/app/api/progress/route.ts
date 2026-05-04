import { NextResponse } from "next/server";

import { getLifetimeAccess } from "@/lib/server/repositories/entitlements-repository";
import {
  countReportsByEmail,
  listScoreHistoryByEmail,
} from "@/lib/server/repositories/reports-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { progressRequestSchema } from "@/lib/validation";

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

    const parsed = progressRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid email");
    }

    const email = parsed.data.email;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true as const,
        hasLifetimeAccess: false,
        reportCount: 0,
        entries: [],
      });
    }

    const reportCount = await countReportsByEmail(email);
    const lifetime = await getLifetimeAccess(email);

    if (!lifetime) {
      return NextResponse.json({
        success: true as const,
        hasLifetimeAccess: false,
        reportCount,
        entries: [],
      });
    }

    const rows = await listScoreHistoryByEmail(email);
    const entries = rows.map((r) => ({
      reportId: r.id,
      recordedAt: r.created_at,
      score: r.readiness_score,
      label: r.readiness_label,
    }));

    return NextResponse.json({
      success: true as const,
      hasLifetimeAccess: true,
      reportCount,
      entries,
    });
  } catch (e) {
    console.error("[progress]", e);
    return jsonError(500, "INTERNAL_ERROR", "Unable to load progress");
  }
}
