import { NextResponse } from "next/server";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import {
  countReportsByUserId,
  listScoreHistoryByUserId,
} from "@/lib/server/repositories/reports-repository";
import { getEffectiveLifetimeAccessByUserId } from "@/lib/server/effective-lifetime-access";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { entitlementLookupRequestSchema } from "@/lib/validation";

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

    try {
      const body = await request.json();
      entitlementLookupRequestSchema.parse(body ?? {});
    } catch {
      return jsonError(400, "VALIDATION_ERROR", "Invalid request shape");
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true as const,
        hasLifetimeAccess: false,
        reportCount: 0,
        entries: [],
      });
    }

    const reportCount = await countReportsByUserId(auth.userId);
    const lifetime = await getEffectiveLifetimeAccessByUserId(auth.userId);

    if (!lifetime) {
      return NextResponse.json({
        success: true as const,
        hasLifetimeAccess: false,
        reportCount,
        entries: [],
      });
    }

    const rows = await listScoreHistoryByUserId(auth.userId);
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
