import "server-only";

import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";
import { isMissingSupervisorTableError, SUPERVISOR_MIGRATION_HINT } from "@/lib/server/supervisor-schema";

import type { PracticeLogRow } from "@/lib/supervisor/types";

export async function listPracticeLogsForParent(parentUserId: string, limit = 50): Promise<PracticeLogRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("practice_logs")
    .select("*")
    .eq("parent_user_id", parentUserId)
    .order("practiced_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSupervisorTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as PracticeLogRow[];
}

export async function createPracticeLog(input: {
  parentUserId: string;
  learnerLinkId: string | null;
  practicedOn: string;
  durationMinutes: number;
  roadType: string;
  skillsPractised: string[];
  confidenceRating: number;
  notes: string | null;
}): Promise<PracticeLogRow> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("practice_logs")
    .insert({
      parent_user_id: input.parentUserId,
      learner_link_id: input.learnerLinkId,
      practiced_on: input.practicedOn,
      duration_minutes: input.durationMinutes,
      road_type: input.roadType.trim(),
      skills_practised: input.skillsPractised,
      confidence_rating: input.confidenceRating,
      notes: input.notes?.trim() || null,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingSupervisorTableError(error)) {
      throw new Error(`Practice log storage is not set up yet. ${SUPERVISOR_MIGRATION_HINT}`);
    }
    throw new Error(error.message);
  }
  return data as PracticeLogRow;
}
