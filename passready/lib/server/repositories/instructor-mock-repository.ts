import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";

import type { MockTestFormPayload } from "@/lib/instructor/mock-test-schemas";
import { mergeMockTestPayload } from "@/lib/instructor/mock-test-defaults";
import {
  aggregateFaultCounts,
  buildMockTestSummary,
  computeMockOutcome,
} from "@/lib/instructor/mock-test-scoring";

export { listPupilsForInstructor, type PupilRow } from "@/lib/server/repositories/instructor-pupil-link-repository";

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
  const normalized = mergeMockTestPayload(payload);
  const counts = aggregateFaultCounts(normalized);
  const summary = buildMockTestSummary(normalized, threshold);
  const { outcome, failReason } = computeMockOutcome(normalized, threshold);
  return {
    driving_fault_count: counts.drivingFaultCount,
    minor_fault_count: counts.minorFaultCount,
    serious_fault_count: counts.seriousFaultCount,
    dangerous_fault_count: counts.dangerousFaultCount,
    outcome,
    fail_reason: failReason,
    form_payload: normalized as unknown as Record<string, unknown>,
    summary_json: {
      summary,
      outcome,
      failReason,
      minorThreshold: threshold,
    } as Record<string, unknown>,
  };
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
    form_payload: computed.form_payload,
    updated_at: now,
    driving_fault_count: computed.driving_fault_count,
    minor_fault_count: computed.minor_fault_count,
    serious_fault_count: computed.serious_fault_count,
    dangerous_fault_count: computed.dangerous_fault_count,
    outcome: computed.outcome,
    fail_reason: computed.fail_reason,
    summary_json: computed.summary_json,
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
