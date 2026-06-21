import { NextResponse } from "next/server";

import { requireInstructorApiUser } from "@/lib/server/api-auth";
import { EmailNotConfiguredError } from "@/lib/email/resend";
import { createPupilInvite, listPupilsForInstructor } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true as const, pupils: [] as const });
  }
  try {
    const pupils = await listPupilsForInstructor(auth.userId);
    return NextResponse.json({ success: true as const, pupils });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to load pupils.";
    return jsonError(500, "PUPILS_ERROR", msg);
  }
}

export async function POST(request: Request) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return jsonError(503, "NOT_CONFIGURED", "Database not configured.");
  }
  try {
    const body = (await request.json()) as { pupilName?: string; pupilEmail?: string };
    const pupilName = typeof body.pupilName === "string" ? body.pupilName.trim() : "";
    const pupilEmail = typeof body.pupilEmail === "string" ? body.pupilEmail.trim() : "";
    if (!pupilName || !pupilEmail) {
      return jsonError(400, "VALIDATION", "Pupil name and email are required.");
    }
    const pupil = await createPupilInvite({ instructorUserId: auth.userId, pupilName, pupilEmail });
    return NextResponse.json({ success: true as const, pupil });
  } catch (e) {
    if (e instanceof EmailNotConfiguredError) {
      return jsonError(503, "EMAIL_NOT_CONFIGURED", e.message);
    }
    const msg = e instanceof Error ? e.message : "Unable to create pupil.";
    return jsonError(500, "PUPIL_CREATE_ERROR", msg);
  }
}
