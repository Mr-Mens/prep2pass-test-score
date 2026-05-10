import { NextResponse } from "next/server";

import { mockTestFormPayloadSchema } from "@/lib/instructor/mock-test-schemas";
import { requireInstructorApiUser } from "@/lib/server/api-auth";
import {
  listMockTestsForInstructor,
  upsertMockTest,
} from "@/lib/server/repositories/instructor-mock-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true as const, mockTests: [] as const });
  }
  try {
    const mockTests = await listMockTestsForInstructor(auth.userId);
    return NextResponse.json({ success: true as const, mockTests });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to load mock tests.";
    return jsonError(500, "MOCK_LIST_ERROR", msg);
  }
}

export async function POST(request: Request) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return jsonError(503, "NOT_CONFIGURED", "Database not configured.");
  }
  try {
    const body = (await request.json()) as {
      id?: string;
      pupilId?: string | null;
      pupilEmailSnapshot?: string;
      pupilNameSnapshot?: string;
      payload?: unknown;
      status?: "draft" | "completed";
      minorFaultThreshold?: number;
    };
    const parsed = mockTestFormPayloadSchema.safeParse(body.payload ?? {});
    if (!parsed.success) {
      return jsonError(400, "VALIDATION", "Invalid mock test payload.");
    }
    const status = body.status === "completed" ? "completed" : "draft";
    const threshold =
      typeof body.minorFaultThreshold === "number" && body.minorFaultThreshold > 0
        ? Math.min(50, Math.floor(body.minorFaultThreshold))
        : 15;

    const row = await upsertMockTest({
      id: typeof body.id === "string" ? body.id : undefined,
      instructorUserId: auth.userId,
      pupilId: typeof body.pupilId === "string" ? body.pupilId : null,
      pupilEmailSnapshot: typeof body.pupilEmailSnapshot === "string" ? body.pupilEmailSnapshot : "",
      pupilNameSnapshot: typeof body.pupilNameSnapshot === "string" ? body.pupilNameSnapshot : "",
      payload: parsed.data,
      status,
      minorFaultThreshold: threshold,
    });
    return NextResponse.json({ success: true as const, mockTest: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to save mock test.";
    return jsonError(500, "MOCK_SAVE_ERROR", msg);
  }
}
