"use server";

import { revalidatePath } from "next/cache";

import {
  createInstructorLessonSchema,
  updateInstructorLessonSchema,
} from "@/lib/instructor-lessons/validation";
import { getUserAppRole } from "@/lib/server/user-app-role";
import {
  completeInstructorLesson,
  createInstructorLesson,
  deleteInstructorLesson,
  setInstructorLessonStatus,
  updateInstructorLesson,
} from "@/lib/server/repositories/instructor-lessons-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { resolveServerAuthUser } from "@/lib/supabase/server";

export type InstructorLessonActionResult =
  | { success: true; lessonId: string }
  | { success: false; message: string };

async function requireInstructorActionUser(): Promise<
  { ok: true; userId: string } | { ok: false; message: string }
> {
  const user = await resolveServerAuthUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };
  if (!user.emailConfirmedAt) return { ok: false, message: "Please verify your email to continue." };
  const role = await getUserAppRole(user.id);
  if (role !== "instructor") return { ok: false, message: "Instructor access only." };
  return { ok: true, userId: user.id };
}

function revalidateLessonPaths(lessonId?: string) {
  revalidatePath("/instructor/lessons");
  revalidatePath("/instructor");
  revalidatePath("/instructor/pupils");
  if (lessonId) {
    revalidatePath(`/instructor/lessons/${lessonId}`);
    revalidatePath(`/instructor/lessons/${lessonId}/edit`);
  }
}

export async function createInstructorLessonAction(
  input: unknown,
): Promise<InstructorLessonActionResult> {
  const auth = await requireInstructorActionUser();
  if (!auth.ok) return { success: false, message: auth.message };
  if (!isSupabaseConfigured()) return { success: false, message: "Database not configured." };

  const parsed = createInstructorLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid lesson data." };
  }

  try {
    const lesson = await createInstructorLesson({
      instructorUserId: auth.userId,
      payload: parsed.data,
    });
    revalidateLessonPaths(lesson.id);
    return { success: true, lessonId: lesson.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Unable to create lesson." };
  }
}

export async function updateInstructorLessonAction(
  lessonId: string,
  input: unknown,
): Promise<InstructorLessonActionResult> {
  const auth = await requireInstructorActionUser();
  if (!auth.ok) return { success: false, message: auth.message };
  if (!isSupabaseConfigured()) return { success: false, message: "Database not configured." };

  const parsed = updateInstructorLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid lesson data." };
  }

  try {
    const lesson = await updateInstructorLesson({
      lessonId,
      instructorUserId: auth.userId,
      payload: parsed.data,
    });
    revalidateLessonPaths(lesson.id);
    return { success: true, lessonId: lesson.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Unable to update lesson." };
  }
}

export async function completeInstructorLessonAction(lessonId: string): Promise<InstructorLessonActionResult> {
  const auth = await requireInstructorActionUser();
  if (!auth.ok) return { success: false, message: auth.message };

  try {
    const lesson = await completeInstructorLesson(lessonId, auth.userId);
    revalidateLessonPaths(lesson.id);
    return { success: true, lessonId: lesson.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Unable to complete lesson." };
  }
}

export async function cancelInstructorLessonAction(lessonId: string): Promise<InstructorLessonActionResult> {
  const auth = await requireInstructorActionUser();
  if (!auth.ok) return { success: false, message: auth.message };

  try {
    const lesson = await setInstructorLessonStatus(lessonId, auth.userId, "cancelled");
    revalidateLessonPaths(lesson.id);
    return { success: true, lessonId: lesson.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Unable to cancel lesson." };
  }
}

export async function deleteInstructorLessonAction(lessonId: string): Promise<InstructorLessonActionResult> {
  const auth = await requireInstructorActionUser();
  if (!auth.ok) return { success: false, message: auth.message };

  try {
    await deleteInstructorLesson(lessonId, auth.userId);
    revalidateLessonPaths(lessonId);
    return { success: true, lessonId };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Unable to delete lesson." };
  }
}
