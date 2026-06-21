import "server-only";

import type { CreateLessonReflectionInput } from "@/lib/lesson-reflections/validation";
import { normalizeLessonReflectionRow, topicConfidenceToDb } from "@/lib/lesson-reflections/confidence";
import type { LessonReflectionRow } from "@/lib/lesson-reflections/types";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

const TABLE = "lesson_reflections";

function isMissingReflectionTableError(error: { message?: string; code?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return error.code === "42P01" || msg.includes("lesson_reflections") || msg.includes("does not exist");
}

export const LESSON_REFLECTIONS_MIGRATION_HINT =
  "Run supabase/migrations/015_lesson_reflections.sql and 016_lesson_reflections_topic_confidence.sql in the Supabase SQL Editor.";

function mapReflectionRow(row: LessonReflectionRow): LessonReflectionRow {
  return normalizeLessonReflectionRow(row);
}

export async function listLessonReflectionsForLearner(
  learnerUserId: string,
  limit = 50,
): Promise<LessonReflectionRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", learnerUserId)
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingReflectionTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => mapReflectionRow(row as LessonReflectionRow));
}

export async function getLessonReflectionById(id: string): Promise<LessonReflectionRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) {
    if (isMissingReflectionTableError(error)) return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapReflectionRow(data as LessonReflectionRow);
}

export async function createLessonReflection(input: {
  learnerUserId: string;
  createdBy: string;
  payload: CreateLessonReflectionInput;
}): Promise<LessonReflectionRow> {
  const supabase = getSupabaseServerClient();
  const { payload } = input;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: input.learnerUserId,
      lesson_date: payload.lessonDate,
      lesson_hours: payload.lessonHours,
      lesson_type: payload.lessonType,
      topics_practised: payload.topicsPractised,
      confidence_before: payload.confidenceBefore,
      confidence_after: payload.confidenceAfter,
      topic_confidence: topicConfidenceToDb(payload.topicConfidence),
      strengths: payload.strengths,
      difficulties: payload.difficulties,
      difficulty_notes: payload.difficultyNotes?.trim() || null,
      next_focus: payload.nextFocus,
      private_practice_planned: payload.privatePracticePlanned,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingReflectionTableError(error)) {
      throw new Error(LESSON_REFLECTIONS_MIGRATION_HINT);
    }
    throw new Error(error.message);
  }
  return mapReflectionRow(data as LessonReflectionRow);
}

export async function listLessonReflectionsForInstructor(
  instructorUserId: string,
  limit = 100,
): Promise<Array<LessonReflectionRow & { learner_name?: string | null }>> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();

  const { data: pupils, error: pupilsError } = await supabase
    .from("instructor_pupils")
    .select("linked_learner_user_id, pupil_name")
    .eq("instructor_user_id", instructorUserId)
    .eq("link_status", "accepted")
    .not("linked_learner_user_id", "is", null);

  if (pupilsError) throw new Error(pupilsError.message);
  const learnerIds = (pupils ?? [])
    .map((p) => p.linked_learner_user_id as string | null)
    .filter((id): id is string => Boolean(id));

  if (learnerIds.length === 0) return [];

  const nameByLearner = new Map(
    (pupils ?? []).map((p) => [p.linked_learner_user_id as string, (p.pupil_name as string | null) ?? null]),
  );

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .in("user_id", learnerIds)
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingReflectionTableError(error)) return [];
    throw new Error(error.message);
  }

  return ((data ?? []) as LessonReflectionRow[]).map((row) => ({
    ...mapReflectionRow(row),
    learner_name: nameByLearner.get(row.user_id) ?? null,
  }));
}

export async function listLessonReflectionsForSupervisor(
  parentUserId: string,
  limit = 100,
): Promise<LessonReflectionRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();

  const { data: link, error: linkError } = await supabase
    .from("parent_learner_links")
    .select("learner_user_id")
    .eq("parent_user_id", parentUserId)
    .eq("status", "linked")
    .maybeSingle();

  if (linkError) throw new Error(linkError.message);
  const learnerUserId = link?.learner_user_id as string | undefined;
  if (!learnerUserId) return [];

  return listLessonReflectionsForLearner(learnerUserId, limit);
}
