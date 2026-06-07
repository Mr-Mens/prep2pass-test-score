import { NextResponse } from "next/server";

import { requireParentApiUser } from "@/lib/server/api-auth";
import {
  createPracticeLog,
  listPracticeLogsForParent,
} from "@/lib/server/repositories/practice-log-repository";
import { getActiveLearnerLinkForParent } from "@/lib/server/repositories/parent-repository";
import { SUPERVISOR_ROAD_TYPES } from "@/lib/supervisor/safety-guidance";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  const auth = await requireParentApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true as const, logs: [] as const });
  }
  try {
    const logs = await listPracticeLogsForParent(auth.userId);
    return NextResponse.json({ success: true as const, logs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to load practice logs.";
    return jsonError(500, "LOGS_ERROR", msg);
  }
}

export async function POST(request: Request) {
  const auth = await requireParentApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return jsonError(503, "NOT_CONFIGURED", "Database not configured.");
  }
  try {
    const body = (await request.json()) as {
      practicedOn?: string;
      durationMinutes?: number;
      roadType?: string;
      skillsPractised?: string[];
      confidenceRating?: number;
      notes?: string;
    };

    const practicedOn = typeof body.practicedOn === "string" ? body.practicedOn.trim() : "";
    const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : 0;
    const roadType = typeof body.roadType === "string" ? body.roadType.trim() : "";
    const skillsPractised = Array.isArray(body.skillsPractised)
      ? body.skillsPractised.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : [];
    const confidenceRating = typeof body.confidenceRating === "number" ? body.confidenceRating : 0;
    const notes = typeof body.notes === "string" ? body.notes : null;

    if (!practicedOn || !/^\d{4}-\d{2}-\d{2}$/.test(practicedOn)) {
      return jsonError(400, "VALIDATION", "Enter a valid practice date.");
    }
    if (durationMinutes < 1 || durationMinutes > 480) {
      return jsonError(400, "VALIDATION", "Duration must be between 1 and 480 minutes.");
    }
    if (!roadType || !SUPERVISOR_ROAD_TYPES.includes(roadType as (typeof SUPERVISOR_ROAD_TYPES)[number])) {
      return jsonError(400, "VALIDATION", "Select a valid road type.");
    }
    if (confidenceRating < 1 || confidenceRating > 5) {
      return jsonError(400, "VALIDATION", "Confidence rating must be between 1 and 5.");
    }

    const link = await getActiveLearnerLinkForParent(auth.userId);
    const log = await createPracticeLog({
      parentUserId: auth.userId,
      learnerLinkId: link?.id ?? null,
      practicedOn,
      durationMinutes,
      roadType,
      skillsPractised,
      confidenceRating,
      notes,
    });

    return NextResponse.json({ success: true as const, log });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to save practice log.";
    return jsonError(500, "LOG_CREATE_ERROR", msg);
  }
}
