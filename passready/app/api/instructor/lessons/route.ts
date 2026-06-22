import { NextResponse } from "next/server";

import { createInstructorLessonSchema } from "@/lib/instructor-lessons/validation";
import { requireInstructorApiUser } from "@/lib/server/api-auth";
import {
  createInstructorLesson,
  listLessonsForInstructor,
} from "@/lib/server/repositories/instructor-lessons-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true as const, lessons: [] });
  }

  try {
    const lessons = await listLessonsForInstructor(auth.userId);
    return NextResponse.json({ success: true as const, lessons });
  } catch (e) {
    return jsonError(500, "LESSONS_ERROR", e instanceof Error ? e.message : "Unable to load lessons.");
  }
}

export async function POST(request: Request) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "NOT_CONFIGURED", "Database not configured.");

  try {
    const raw = await request.json();
    const parsed = createInstructorLessonSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Invalid lesson data.");
    }

    const lesson = await createInstructorLesson({
      instructorUserId: auth.userId,
      payload: parsed.data,
    });
    return NextResponse.json({ success: true as const, lesson });
  } catch (e) {
    return jsonError(500, "LESSON_CREATE_ERROR", e instanceof Error ? e.message : "Unable to create lesson.");
  }
}
