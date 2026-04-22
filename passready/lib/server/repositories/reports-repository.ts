import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";
import { migrateWeakAreaIds } from "@/lib/weak-area-migration";
import type { AssessmentPayload, MockReadinessResult, ReportDbRecord, ReportSummaryItem } from "@/lib/validation";

function withMigratedWeakAreas(row: ReportDbRecord): ReportDbRecord {
  return { ...row, weak_areas: migrateWeakAreaIds(row.weak_areas) };
}

type CreateReportInput = {
  stripeSessionId: string;
  paymentStatus: string;
  assessment: AssessmentPayload;
  result: MockReadinessResult;
};

function toDbPayload(input: CreateReportInput) {
  const { assessment, result } = input;
  return {
    stripe_session_id: input.stripeSessionId,
    payment_status: input.paymentStatus,
    full_name: assessment.fullName,
    email: assessment.email,
    lessons_taken: assessment.lessonsTaken,
    test_booked: assessment.testBooked === "yes",
    test_date: assessment.testDate ?? null,
    mock_test_taken: assessment.mockTestTaken === "yes",
    mock_test_result: assessment.mockTestResult,
    serious_faults: assessment.seriousFaults,
    driving_faults: assessment.drivingFaults,
    confidence_level: assessment.confidenceLevel,
    weak_areas: assessment.weakAreas,
    extra_notes: assessment.extraNotes ?? null,
    readiness_score: result.readinessScore,
    readiness_label: result.readinessLabel,
    summary: result.summary,
    risk_areas: result.riskAreas,
    next_steps: result.nextSteps,
    recommended_hours: result.recommendedHours,
    coach_message: result.coachMessage,
    report_source: result.metadata.source,
    model_name: result.metadata.model ?? null,
    generated_at: result.metadata.generatedAt,
    raw_metadata: result.metadata,
  };
}

export async function createReport(input: CreateReportInput): Promise<ReportDbRecord> {
  const supabase = getSupabaseServerClient();
  const payload = toDbPayload(input);
  const { data, error } = await supabase.from("reports").insert(payload).select("*").single();

  if (error || !data) {
    console.error("[reports] insert failed", error?.message ?? error);
    throw new Error(`Failed to create report: ${error?.message ?? "unknown"}`);
  }
  return withMigratedWeakAreas(data as ReportDbRecord);
}

export async function getReportByStripeSessionId(stripeSessionId: string): Promise<ReportDbRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to fetch report");
  }
  return data ? withMigratedWeakAreas(data as ReportDbRecord) : null;
}

export async function updateReportByStripeSessionId(
  stripeSessionId: string,
  input: CreateReportInput,
): Promise<ReportDbRecord> {
  const supabase = getSupabaseServerClient();
  const payload = toDbPayload(input);
  const { data, error } = await supabase
    .from("reports")
    .update(payload)
    .eq("stripe_session_id", stripeSessionId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to update report");
  }
  return withMigratedWeakAreas(data as ReportDbRecord);
}

export async function getReportById(id: string): Promise<ReportDbRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Failed to fetch report by id");
  return data ? withMigratedWeakAreas(data as ReportDbRecord) : null;
}

export async function getReportsByEmail(email: string): Promise<ReportDbRecord[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error("Failed to fetch reports by email");
  return ((data as ReportDbRecord[]) ?? []).map(withMigratedWeakAreas);
}

export async function getReportSummaryByEmail(email: string): Promise<ReportSummaryItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id,created_at,readiness_score,readiness_label,report_source")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error("Failed to fetch report summary by email");
  return (data as ReportSummaryItem[]) ?? [];
}
