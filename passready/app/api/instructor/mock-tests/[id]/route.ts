import { NextResponse } from "next/server";

import { mockTestFormPayloadSchema } from "@/lib/instructor/mock-test-schemas";
import { requireInstructorApiUser } from "@/lib/server/api-auth";
import {
  getMockTestForInstructor,
  upsertMockTest,
} from "@/lib/server/repositories/instructor-mock-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

type Ctx = { params: { id: string } };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "NOT_CONFIGURED", "Database not configured.");

  const { id } = ctx.params;
  const row = await getMockTestForInstructor(id, auth.userId);
  if (!row) return jsonError(404, "NOT_FOUND", "Mock test not found.");
  return NextResponse.json({ success: true as const, mockTest: row });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "NOT_CONFIGURED", "Database not configured.");

  const { id } = ctx.params;
  const existing = await getMockTestForInstructor(id, auth.userId);
  if (!existing) return jsonError(404, "NOT_FOUND", "Mock test not found.");

  try {
    const body = (await request.json()) as {
      payload?: unknown;
      status?: "draft" | "completed";
      minorFaultThreshold?: number;
      pupilId?: string | null;
      pupilEmailSnapshot?: string;
      pupilNameSnapshot?: string;
    };
    const parsed = mockTestFormPayloadSchema.safeParse(body.payload ?? existing.form_payload);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION", "Invalid mock test payload.");
    }
    const status = body.status === "completed" ? "completed" : body.status === "draft" ? "draft" : existing.status;
    const threshold =
      typeof body.minorFaultThreshold === "number" && body.minorFaultThreshold > 0
        ? Math.min(50, Math.floor(body.minorFaultThreshold))
        : existing.minor_fault_threshold;

    const row = await upsertMockTest({
      id,
      instructorUserId: auth.userId,
      pupilId:
        typeof body.pupilId === "string" || body.pupilId === null
          ? (body.pupilId ?? null)
          : existing.pupil_id,
      pupilEmailSnapshot:
        typeof body.pupilEmailSnapshot === "string" ? body.pupilEmailSnapshot : (existing.pupil_email_snapshot ?? ""),
      pupilNameSnapshot:
        typeof body.pupilNameSnapshot === "string" ? body.pupilNameSnapshot : (existing.pupil_name_snapshot ?? ""),
      payload: parsed.data,
      status,
      minorFaultThreshold: threshold,
    });
    return NextResponse.json({ success: true as const, mockTest: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to update mock test.";
    return jsonError(500, "MOCK_UPDATE_ERROR", msg);
  }
}
