import { NextResponse } from "next/server";

import { updateInstructorLessonSchema } from "@/lib/instructor-lessons/validation";
import { requireInstructorApiUser } from "@/lib/server/api-auth";
import {
  deleteInstructorLesson,
  getLessonForInstructor,
  setInstructorLessonStatus,
  updateInstructorLesson,
} from "@/lib/server/repositories/instructor-lessons-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET(_request: Request, context: { params: { id: string } }) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "NOT_CONFIGURED", "Database not configured.");

  try {
    const lesson = await getLessonForInstructor(context.params.id, auth.userId);
    if (!lesson) return jsonError(404, "NOT_FOUND", "Lesson not found.");
    return NextResponse.json({ success: true as const, lesson });
  } catch (e) {
    return jsonError(500, "LESSON_ERROR", e instanceof Error ? e.message : "Unable to load lesson.");
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "NOT_CONFIGURED", "Database not configured.");

  try {
    const raw = await request.json();
    if (raw?.action === "complete") {
      const lesson = await setInstructorLessonStatus(context.params.id, auth.userId, "completed");
      return NextResponse.json({ success: true as const, lesson });
    }
    if (raw?.action === "cancel") {
      const lesson = await setInstructorLessonStatus(context.params.id, auth.userId, "cancelled");
      return NextResponse.json({ success: true as const, lesson });
    }

    const parsed = updateInstructorLessonSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Invalid lesson data.");
    }

    const lesson = await updateInstructorLesson({
      lessonId: context.params.id,
      instructorUserId: auth.userId,
      payload: parsed.data,
    });
    return NextResponse.json({ success: true as const, lesson });
  } catch (e) {
    return jsonError(500, "LESSON_UPDATE_ERROR", e instanceof Error ? e.message : "Unable to update lesson.");
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "NOT_CONFIGURED", "Database not configured.");

  try {
    await deleteInstructorLesson(context.params.id, auth.userId);
    return NextResponse.json({ success: true as const });
  } catch (e) {
    return jsonError(500, "LESSON_DELETE_ERROR", e instanceof Error ? e.message : "Unable to delete lesson.");
  }
}
