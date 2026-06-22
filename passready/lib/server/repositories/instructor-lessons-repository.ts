import "server-only";

import type { CreateInstructorLessonInput, UpdateInstructorLessonInput } from "@/lib/instructor-lessons/validation";
import type { InstructorLessonRow, InstructorLessonWithPupil, LessonStatus } from "@/lib/instructor-lessons/types";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

const TABLE = "instructor_lessons";

export const INSTRUCTOR_LESSONS_MIGRATION_HINT =
  "Run supabase/migrations/017_instructor_lessons.sql in the Supabase SQL Editor.";

function isMissingLessonsTableError(error: { message?: string; code?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return error.code === "42P01" || msg.includes("instructor_lessons") || msg.includes("does not exist");
}

function normalizeStartTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

async function attachPupilDetails(rows: InstructorLessonRow[]): Promise<InstructorLessonWithPupil[]> {
  if (rows.length === 0) return [];
  const supabase = getSupabaseServerClient();
  const pupilIds = Array.from(new Set(rows.map((row) => row.pupil_id)));
  const { data, error } = await supabase
    .from("instructor_pupils")
    .select("id, pupil_name, pupil_email, linked_learner_user_id")
    .in("id", pupilIds);

  if (error) throw new Error(error.message);

  const pupilById = new Map(
    (data ?? []).map((pupil) => [
      pupil.id as string,
      {
        pupil_name: (pupil.pupil_name as string) ?? "",
        pupil_email: (pupil.pupil_email as string) ?? "",
        linked_learner_user_id: (pupil.linked_learner_user_id as string | null) ?? null,
      },
    ]),
  );

  return rows.map((row) => {
    const pupil = pupilById.get(row.pupil_id);
    return {
      ...row,
      start_time: row.start_time.slice(0, 5),
      pupil_name: pupil?.pupil_name ?? "Unknown pupil",
      pupil_email: pupil?.pupil_email ?? "",
      linked_learner_user_id: pupil?.linked_learner_user_id ?? null,
    };
  });
}

export async function listLessonsForInstructor(
  instructorUserId: string,
  limit = 200,
): Promise<InstructorLessonWithPupil[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("instructor_user_id", instructorUserId)
    .order("lesson_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingLessonsTableError(error)) return [];
    throw new Error(error.message);
  }

  return attachPupilDetails((data ?? []) as InstructorLessonRow[]);
}

export async function listLessonsForPupil(
  pupilId: string,
  instructorUserId: string,
  limit = 8,
): Promise<InstructorLessonWithPupil[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("instructor_user_id", instructorUserId)
    .eq("pupil_id", pupilId)
    .order("lesson_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingLessonsTableError(error)) return [];
    throw new Error(error.message);
  }

  return attachPupilDetails((data ?? []) as InstructorLessonRow[]);
}

export async function listUpcomingLessonsForInstructor(
  instructorUserId: string,
  limit = 5,
): Promise<InstructorLessonWithPupil[]> {
  const lessons = await listLessonsForInstructor(instructorUserId, 100);
  const today = new Date().toISOString().slice(0, 10);

  return lessons
    .filter((lesson) => lesson.status === "planned" && lesson.lesson_date >= today)
    .sort((a, b) => {
      const aValue = new Date(`${a.lesson_date}T${a.start_time}`).getTime();
      const bValue = new Date(`${b.lesson_date}T${b.start_time}`).getTime();
      return aValue - bValue;
    })
    .slice(0, limit);
}

export async function getLessonForInstructor(
  lessonId: string,
  instructorUserId: string,
): Promise<InstructorLessonWithPupil | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", lessonId)
    .eq("instructor_user_id", instructorUserId)
    .maybeSingle();

  if (error) {
    if (isMissingLessonsTableError(error)) return null;
    throw new Error(error.message);
  }
  if (!data) return null;

  const [lesson] = await attachPupilDetails([data as InstructorLessonRow]);
  return lesson ?? null;
}

async function assertPupilOwnedByInstructor(pupilId: string, instructorUserId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_pupils")
    .select("id")
    .eq("id", pupilId)
    .eq("instructor_user_id", instructorUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("This pupil is not on your roster.");
}

export async function createInstructorLesson(input: {
  instructorUserId: string;
  payload: CreateInstructorLessonInput;
}): Promise<InstructorLessonWithPupil> {
  await assertPupilOwnedByInstructor(input.payload.pupilId, input.instructorUserId);
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { payload } = input;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      instructor_user_id: input.instructorUserId,
      pupil_id: payload.pupilId,
      lesson_date: payload.lessonDate,
      start_time: normalizeStartTime(payload.startTime),
      duration_minutes: payload.durationMinutes,
      lesson_focus: payload.lessonFocus,
      location: payload.location?.trim() || null,
      instructor_notes: payload.instructorNotes?.trim() || null,
      status: payload.status,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingLessonsTableError(error)) throw new Error(INSTRUCTOR_LESSONS_MIGRATION_HINT);
    throw new Error(error.message);
  }

  const [lesson] = await attachPupilDetails([data as InstructorLessonRow]);
  if (!lesson) throw new Error("Lesson was created but could not be loaded.");
  return lesson;
}

export async function updateInstructorLesson(input: {
  lessonId: string;
  instructorUserId: string;
  payload: UpdateInstructorLessonInput;
}): Promise<InstructorLessonWithPupil> {
  const existing = await getLessonForInstructor(input.lessonId, input.instructorUserId);
  if (!existing) throw new Error("Lesson not found.");

  if (input.payload.pupilId) {
    await assertPupilOwnedByInstructor(input.payload.pupilId, input.instructorUserId);
  }

  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const { payload } = input;

  if (payload.pupilId !== undefined) patch.pupil_id = payload.pupilId;
  if (payload.lessonDate !== undefined) patch.lesson_date = payload.lessonDate;
  if (payload.startTime !== undefined) patch.start_time = normalizeStartTime(payload.startTime);
  if (payload.durationMinutes !== undefined) patch.duration_minutes = payload.durationMinutes;
  if (payload.lessonFocus !== undefined) patch.lesson_focus = payload.lessonFocus;
  if (payload.location !== undefined) patch.location = payload.location?.trim() || null;
  if (payload.instructorNotes !== undefined) patch.instructor_notes = payload.instructorNotes?.trim() || null;
  if (payload.status !== undefined) patch.status = payload.status;

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", input.lessonId)
    .eq("instructor_user_id", input.instructorUserId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const [lesson] = await attachPupilDetails([data as InstructorLessonRow]);
  if (!lesson) throw new Error("Lesson was updated but could not be loaded.");
  return lesson;
}

export async function deleteInstructorLesson(lessonId: string, instructorUserId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", lessonId).eq("instructor_user_id", instructorUserId);
  if (error) throw new Error(error.message);
}

export async function setInstructorLessonStatus(
  lessonId: string,
  instructorUserId: string,
  status: LessonStatus,
): Promise<InstructorLessonWithPupil> {
  return updateInstructorLesson({
    lessonId,
    instructorUserId,
    payload: { status },
  });
}
