import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";
import { migrateWeakAreaIds } from "@/lib/weak-area-migration";
import type { AssessmentPayload, MockReadinessResult, ReportDbRecord, ReportSummaryItem } from "@/lib/validation";

function withMigratedWeakAreas(row: ReportDbRecord): ReportDbRecord {
  return { ...row, weak_areas: migrateWeakAreaIds(row.weak_areas) };
}

type CreateReportInput = {
  userId: string;
  stripeSessionId: string;
  paymentStatus: string;
  assessment: AssessmentPayload;
  result: MockReadinessResult;
};

function toDbPayload(input: CreateReportInput) {
  const { assessment, result } = input;
  return {
    user_id: input.userId,
    stripe_session_id: input.stripeSessionId,
    payment_status: input.paymentStatus,
    full_name: assessment.fullName,
    email: assessment.email,
    lessons_taken: assessment.lessonsTaken,
    test_booked: assessment.testBooked === "yes",
    test_date:
      typeof assessment.testDate === "string" && assessment.testDate.trim() !== ""
        ? assessment.testDate.trim()
        : null,
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

function isUniqueStripeSessionViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  const m = error.message ?? "";
  return m.includes("duplicate key") && m.includes("stripe_session_id");
}

export async function createReport(input: CreateReportInput): Promise<ReportDbRecord> {
  const supabase = getSupabaseServerClient();
  const payload = toDbPayload(input);
  const { data, error } = await supabase.from("reports").insert(payload).select("*").single();

  if (!error && data) {
    return withMigratedWeakAreas(data as ReportDbRecord);
  }

  if (isUniqueStripeSessionViolation(error)) {
    const existing = await getReportByStripeSessionId(input.stripeSessionId);
    if (existing) {
      console.warn("[reports] insert raced duplicate stripe_session_id; returning existing row", {
        stripeSessionId: input.stripeSessionId,
        reportId: existing.id,
      });
      return existing;
    }
  }

  console.error("[reports] insert failed", error?.message ?? error);
  throw new Error(`Failed to create report: ${error?.message ?? "unknown"}`);
}

export async function getReportByStripeSessionId(stripeSessionId: string): Promise<ReportDbRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (error) {
    console.error("[reports] getReportByStripeSessionId failed", {
      stripeSessionId,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Failed to fetch report: ${error.message}`);
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

export async function getReportByIdForUser(reportId: string, userId: string): Promise<ReportDbRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Failed to fetch report");
  return data ? withMigratedWeakAreas(data as ReportDbRecord) : null;
}

export type ScoreHistoryRow = {
  id: string;
  created_at: string;
  readiness_score: number;
  readiness_label: string;
};

/** Ordered oldest → newest for progress charts. */
export async function listScoreHistoryByUserId(userId: string): Promise<ScoreHistoryRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, created_at, readiness_score, readiness_label")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[reports] listScoreHistoryByUserId failed", error.message);
    throw new Error("Failed to fetch score history");
  }
  return (data as ScoreHistoryRow[]) ?? [];
}

export async function countReportsByUserId(userId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new Error("Failed to count reports");
  return count ?? 0;
}

export async function getReportsByUserId(userId: string): Promise<ReportDbRecord[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error("Failed to fetch reports for user");
  return ((data as ReportDbRecord[]) ?? []).map(withMigratedWeakAreas);
}

export async function getReportSummaryByUserId(userId: string): Promise<ReportSummaryItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id,created_at,readiness_score,readiness_label,report_source")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error("Failed to fetch report summary for user");
  return (data as ReportSummaryItem[]) ?? [];
}
