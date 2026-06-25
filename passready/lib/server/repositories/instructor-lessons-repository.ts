import "server-only";

import type { CreateInstructorLessonInput, UpdateInstructorLessonInput } from "@/lib/instructor-lessons/validation";
import { FUTURE_LESSON_COMPLETE_MESSAGE, isLessonInFuture } from "@/lib/instructor-lessons/format";
import type { InstructorLessonRow, InstructorLessonWithPupil, LessonStatus } from "@/lib/instructor-lessons/types";
import { createLessonReflectionRequestNotification } from "@/lib/server/repositories/app-notifications-repository";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

const TABLE = "instructor_lessons";

export const INSTRUCTOR_LESSONS_MIGRATION_HINT =
  "Run supabase/migrations/017_instructor_lessons.sql and 018_instructor_lessons_reflection_pending.sql in the Supabase SQL Editor.";

function isMissingLessonsTableError(error: { message?: string; code?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return error.code === "42P01" || msg.includes("instructor_lessons") || msg.includes("does not exist");
}

function isLessonStatusConstraintError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return msg.includes("instructor_lessons_status_check") || (msg.includes("check constraint") && msg.includes("status"));
}

function normalizeStartTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

async function fetchLatestPassPilotScores(learnerUserIds: string[]): Promise<Map<string, number>> {
  if (learnerUserIds.length === 0) return new Map();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("user_id, readiness_score, created_at")
    .in("user_id", learnerUserIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const scores = new Map<string, number>();
  for (const row of data ?? []) {
    const userId = row.user_id as string;
    if (!scores.has(userId)) scores.set(userId, row.readiness_score as number);
  }
  return scores;
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

  const learnerIds = Array.from(
    new Set(
      Array.from(pupilById.values())
        .map((pupil) => pupil.linked_learner_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const scoresByLearner = await fetchLatestPassPilotScores(learnerIds);

  return rows.map((row) => {
    const pupil = pupilById.get(row.pupil_id);
    const linkedLearnerUserId = pupil?.linked_learner_user_id ?? null;
    return {
      ...row,
      start_time: row.start_time.slice(0, 5),
      pupil_name: pupil?.pupil_name ?? "Unknown pupil",
      pupil_email: pupil?.pupil_email ?? "",
      linked_learner_user_id: linkedLearnerUserId,
      pass_pilot_score: linkedLearnerUserId ? (scoresByLearner.get(linkedLearnerUserId) ?? null) : null,
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

export type LearnerLessonView = {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_focus: string[];
  location: string | null;
  status: LessonStatus;
  instructor_name: string;
};

export async function listLessonsForLearner(learnerUserId: string, limit = 100): Promise<LearnerLessonView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();

  const { data: pupils, error: pupilsError } = await supabase
    .from("instructor_pupils")
    .select("id, instructor_user_id")
    .eq("linked_learner_user_id", learnerUserId)
    .eq("link_status", "accepted");

  if (pupilsError) throw new Error(pupilsError.message);
  if (!pupils?.length) return [];

  const pupilIds = pupils.map((row) => row.id as string);
  const instructorIds = Array.from(new Set(pupils.map((row) => row.instructor_user_id as string)));

  const { data: profiles, error: profilesError } = await supabase
    .from("instructor_profiles")
    .select("user_id, display_name")
    .in("user_id", instructorIds);

  if (profilesError) throw new Error(profilesError.message);

  const instructorNameById = new Map<string, string>(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      ((profile.display_name as string | null) ?? "").trim() || "Your instructor",
    ]),
  );

  const { data: lessons, error: lessonsError } = await supabase
    .from(TABLE)
    .select("id, instructor_user_id, lesson_date, start_time, duration_minutes, lesson_focus, location, status")
    .in("pupil_id", pupilIds)
    .neq("status", "cancelled")
    .order("lesson_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(limit);

  if (lessonsError) {
    if (isMissingLessonsTableError(lessonsError)) return [];
    throw new Error(lessonsError.message);
  }

  return (lessons ?? []).map((lesson) => ({
    id: lesson.id as string,
    lesson_date: lesson.lesson_date as string,
    start_time: (lesson.start_time as string).slice(0, 5),
    duration_minutes: lesson.duration_minutes as number,
    lesson_focus: (lesson.lesson_focus as string[]) ?? [],
    location: (lesson.location as string | null) ?? null,
    status: lesson.status as LessonStatus,
    instructor_name: instructorNameById.get(lesson.instructor_user_id as string) ?? "Your instructor",
  }));
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
  try {
    return await updateInstructorLesson({
      lessonId,
      instructorUserId,
      payload: { status },
    });
  } catch (error) {
    if (status === "reflection_pending" && isLessonStatusConstraintError(error)) {
      return updateInstructorLesson({
        lessonId,
        instructorUserId,
        payload: { status: "completed" },
      });
    }
    throw error;
  }
}

export async function completeInstructorLesson(
  lessonId: string,
  instructorUserId: string,
): Promise<InstructorLessonWithPupil> {
  const existing = await getLessonForInstructor(lessonId, instructorUserId);
  if (!existing) throw new Error("Lesson not found.");
  if (isLessonInFuture(existing)) {
    throw new Error(FUTURE_LESSON_COMPLETE_MESSAGE);
  }

  const linkedLearnerId = existing.linked_learner_user_id;
  if (!linkedLearnerId) {
    return setInstructorLessonStatus(lessonId, instructorUserId, "completed");
  }

  const access = await getLearnerAccessStatus(linkedLearnerId);
  if (!access.hasPremiumAccess) {
    return setInstructorLessonStatus(lessonId, instructorUserId, "completed");
  }

  const lesson = await setInstructorLessonStatus(lessonId, instructorUserId, "reflection_pending");
  const instructorName = await getInstructorDisplayName(instructorUserId);

  await createLessonReflectionRequestNotification({
    learnerUserId: linkedLearnerId,
    lessonId: lesson.id,
    lessonDate: lesson.lesson_date,
    instructorName,
    durationMinutes: lesson.duration_minutes,
    lessonFocus: lesson.lesson_focus,
  });

  return lesson;
}

async function getInstructorDisplayName(instructorUserId: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("instructor_profiles")
    .select("display_name")
    .eq("user_id", instructorUserId)
    .maybeSingle();
  return (data?.display_name as string | undefined)?.trim() || "Your instructor";
}

export async function markLessonReflectionSubmittedByLearner(
  lessonId: string,
  learnerUserId: string,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: lesson, error } = await supabase
    .from(TABLE)
    .select("id, pupil_id, status")
    .eq("id", lessonId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!lesson || lesson.status !== "reflection_pending") return;

  const { data: pupil, error: pupilError } = await supabase
    .from("instructor_pupils")
    .select("linked_learner_user_id")
    .eq("id", lesson.pupil_id as string)
    .maybeSingle();

  if (pupilError) throw new Error(pupilError.message);
  if (pupil?.linked_learner_user_id !== learnerUserId) return;

  await supabase
    .from(TABLE)
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", lessonId);
}
