import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";

import type { MockTestFormPayload } from "@/lib/instructor/mock-test-schemas";
import {
  aggregateFaultCounts,
  buildMockTestSummary,
  computeMockOutcome,
} from "@/lib/instructor/mock-test-scoring";

export type PupilRow = {
  id: string;
  instructor_user_id: string;
  pupil_name: string;
  pupil_email: string;
  linked_learner_user_id: string | null;
  created_at: string;
};

export type MockTestRow = {
  id: string;
  instructor_user_id: string;
  pupil_id: string | null;
  pupil_email_snapshot: string | null;
  pupil_name_snapshot: string | null;
  status: "draft" | "completed";
  minor_fault_threshold: number;
  driving_fault_count: number;
  minor_fault_count: number;
  serious_fault_count: number;
  dangerous_fault_count: number;
  outcome: "pass" | "fail" | "undecided";
  fail_reason: string | null;
  form_payload: MockTestFormPayload;
  summary_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function recomputeFromPayload(payload: MockTestFormPayload, threshold: number) {
  const counts = aggregateFaultCounts(payload);
  const summary = buildMockTestSummary(payload, threshold);
  const { outcome, failReason } = computeMockOutcome(payload, threshold);
  return {
    driving_fault_count: counts.drivingFaultCount,
    minor_fault_count: counts.minorFaultCount,
    serious_fault_count: counts.seriousFaultCount,
    dangerous_fault_count: counts.dangerousFaultCount,
    outcome,
    fail_reason: failReason,
    summary_json: {
      summary,
      outcome,
      failReason,
      minorThreshold: threshold,
    } as Record<string, unknown>,
  };
}

export async function listPupilsForInstructor(instructorUserId: string): Promise<PupilRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_pupils")
    .select("*")
    .eq("instructor_user_id", instructorUserId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PupilRow[];
}

export async function createPupil(input: {
  instructorUserId: string;
  pupilName: string;
  pupilEmail: string;
}): Promise<PupilRow> {
  const supabase = getSupabaseServerClient();
  const email = input.pupilEmail.trim().toLowerCase();

  const { data: reportRow } = await supabase
    .from("reports")
    .select("user_id")
    .eq("email", email)
    .not("user_id", "is", null)
    .limit(1)
    .maybeSingle();

  const linked =
    reportRow && (reportRow as { user_id: string | null }).user_id
      ? (reportRow as { user_id: string }).user_id
      : null;

  const { data, error } = await supabase
    .from("instructor_pupils")
    .insert({
      instructor_user_id: input.instructorUserId,
      pupil_name: input.pupilName.trim(),
      pupil_email: email,
      linked_learner_user_id: linked,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as PupilRow;
}

export async function listMockTestsForInstructor(instructorUserId: string): Promise<MockTestRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_mock_tests")
    .select("*")
    .eq("instructor_user_id", instructorUserId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MockTestRow[];
}

export async function getMockTestForInstructor(
  id: string,
  instructorUserId: string,
): Promise<MockTestRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_mock_tests")
    .select("*")
    .eq("id", id)
    .eq("instructor_user_id", instructorUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as MockTestRow) : null;
}

export async function upsertMockTest(input: {
  id?: string;
  instructorUserId: string;
  pupilId: string | null;
  pupilEmailSnapshot: string;
  pupilNameSnapshot: string;
  payload: MockTestFormPayload;
  status: "draft" | "completed";
  minorFaultThreshold: number;
}): Promise<MockTestRow> {
  const supabase = getSupabaseServerClient();
  const computed = recomputeFromPayload(input.payload, input.minorFaultThreshold);
  const now = new Date().toISOString();

  const base = {
    instructor_user_id: input.instructorUserId,
    pupil_id: input.pupilId,
    pupil_email_snapshot: input.pupilEmailSnapshot.trim().toLowerCase(),
    pupil_name_snapshot: input.pupilNameSnapshot.trim(),
    status: input.status,
    minor_fault_threshold: input.minorFaultThreshold,
    form_payload: input.payload as unknown as Record<string, unknown>,
    updated_at: now,
    ...computed,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("instructor_mock_tests")
      .update(base)
      .eq("id", input.id)
      .eq("instructor_user_id", input.instructorUserId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as MockTestRow;
  }

  const { data, error } = await supabase.from("instructor_mock_tests").insert(base).select("*").single();
  if (error) throw new Error(error.message);
  return data as MockTestRow;
}
