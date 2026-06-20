import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";
import type { JourneySnapshot } from "@/lib/dashboard/journey-types";
import type { AssessmentPayload, MockReadinessResult, ReportDbRecord, ReportSummaryItem } from "@/lib/validation";
import { migrateWeakAreaIds } from "@/lib/weak-area-migration";
import { weakAreaDetailsFromRawMetadata } from "@/lib/weak-area-metadata";

function withMigratedWeakAreas(row: ReportDbRecord): ReportDbRecord {
  const weak_areas = migrateWeakAreaIds(row.weak_areas);
  const columnDetails = row.weak_area_details ?? [];
  const metaDetails = weakAreaDetailsFromRawMetadata(row.raw_metadata);
  const weak_area_details = columnDetails.length > 0 ? columnDetails : metaDetails;
  return { ...row, weak_areas, weak_area_details };
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
  const weakAreaDetails = assessment.weakAreaDetails ?? result.metadata.weakAreaDetails ?? [];
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
    weak_area_details: weakAreaDetails,
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
    raw_metadata: {
      ...result.metadata,
      ...(weakAreaDetails.length > 0 ? { weakAreaDetails } : {}),
    },
  };
}

function isUniqueStripeSessionViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  const m = error.message ?? "";
  return m.includes("duplicate key") && m.includes("stripe_session_id");
}

function isMissingWeakAreaDetailsColumn(error: { message?: string } | null): boolean {
  const m = error?.message ?? "";
  return m.includes("weak_area_details") && m.includes("schema cache");
}

async function insertReportRow(payload: ReturnType<typeof toDbPayload>) {
  const supabase = getSupabaseServerClient();
  let attempt = payload;
  for (let i = 0; i < 2; i++) {
    const { data, error } = await supabase.from("reports").insert(attempt).select("*").single();
    if (!error && data) return { data: data as ReportDbRecord, error: null };
    if (i === 0 && isMissingWeakAreaDetailsColumn(error)) {
      console.warn(
        "[reports] weak_area_details column missing; retrying insert with raw_metadata only. Run supabase/migrations/009_weak_area_details.sql",
      );
      const { weak_area_details: _omit, ...withoutColumn } = attempt;
      attempt = withoutColumn as typeof attempt;
      continue;
    }
    return { data: null, error };
  }
  return { data: null, error: { message: "insert failed" } };
}

async function updateReportRow(stripeSessionId: string, payload: ReturnType<typeof toDbPayload>) {
  const supabase = getSupabaseServerClient();
  let attempt = payload;
  for (let i = 0; i < 2; i++) {
    const { data, error } = await supabase
      .from("reports")
      .update(attempt)
      .eq("stripe_session_id", stripeSessionId)
      .select("*")
      .single();
    if (!error && data) return { data: data as ReportDbRecord, error: null };
    if (i === 0 && isMissingWeakAreaDetailsColumn(error)) {
      console.warn(
        "[reports] weak_area_details column missing; retrying update with raw_metadata only. Run supabase/migrations/009_weak_area_details.sql",
      );
      const { weak_area_details: _omit, ...withoutColumn } = attempt;
      attempt = withoutColumn as typeof attempt;
      continue;
    }
    return { data: null, error };
  }
  return { data: null, error: { message: "update failed" } };
}

export async function createReport(input: CreateReportInput): Promise<ReportDbRecord> {
  const payload = toDbPayload(input);
  const { data, error } = await insertReportRow(payload);

  if (data) {
    return withMigratedWeakAreas(data);
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
  const payload = toDbPayload(input);
  const { data, error } = await updateReportRow(stripeSessionId, payload);

  if (error || !data) {
    throw new Error("Failed to update report");
  }
  return withMigratedWeakAreas(data);
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

/** Snapshot fields for personalised lifetime dashboard narratives. Ordered oldest → newest. */
export async function listJourneySnapshotsByUserId(userId: string): Promise<JourneySnapshot[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, created_at, readiness_score, readiness_label, weak_areas, mock_test_taken")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[reports] listJourneySnapshotsByUserId failed", error.message);
    throw new Error("Failed to fetch journey snapshots");
  }

  return (data ?? []).map((row) => ({
    ...row,
    weak_areas: migrateWeakAreaIds((row as { weak_areas: string[] | null }).weak_areas ?? []),
  })) as JourneySnapshot[];
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

export async function getLatestReportTestBooking(userId: string): Promise<{
  reportId: string;
  testBooked: boolean;
  testDate: string | null;
  mockTestTaken: boolean;
} | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, test_booked, test_date, mock_test_taken")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as {
    id: string;
    test_booked: boolean;
    test_date: string | null;
    mock_test_taken: boolean;
  };

  return {
    reportId: row.id,
    testBooked: row.test_booked,
    testDate: row.test_date,
    mockTestTaken: row.mock_test_taken,
  };
}

export async function getReportSummaryByUserId(userId: string, limit = 20): Promise<ReportSummaryItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id,created_at,readiness_score,readiness_label,report_source")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("Failed to fetch report summary for user");
  return (data as ReportSummaryItem[]) ?? [];
}

const DASHBOARD_REPORT_COLUMNS =
  "id,created_at,readiness_score,readiness_label,summary,next_steps,risk_areas,weak_areas,lessons_taken,mock_test_taken,mock_test_result,serious_faults,driving_faults,confidence_level,test_booked,test_date,raw_metadata,weak_area_details,report_source";

/** Latest report with dashboard fields only (avoids loading full report history). */
export async function getLatestReportForDashboard(userId: string): Promise<ReportDbRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select(DASHBOARD_REPORT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("Failed to fetch latest report for dashboard");
  if (!data) return null;
  return withMigratedWeakAreas(data as ReportDbRecord);
}

export async function getRecentReportSummaries(userId: string, limit = 3): Promise<ReportSummaryItem[]> {
  return getReportSummaryByUserId(userId, limit);
}
