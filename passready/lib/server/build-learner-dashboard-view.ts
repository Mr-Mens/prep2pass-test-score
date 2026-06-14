import "server-only";

import { deriveDeltaVsPrior, deriveStrongestPhrase } from "@/lib/dashboard/journey-insights";
import type { JourneySnapshot } from "@/lib/dashboard/journey-types";
import { formatIsoDateUk } from "@/lib/formatting";
import { buildReportViewModel } from "@/lib/report-view-model";
import { buildTopPriorities } from "@/lib/report-insights";
import { getEntitlementLookupForUser } from "@/lib/server/repositories/entitlements-repository";
import {
  getLatestReportTestBooking,
  getReportsByUserId,
  listJourneySnapshotsByUserId,
} from "@/lib/server/repositories/reports-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AssessmentPayload, ReadinessLabel, ReportSummaryItem, SyllabusProgressSnapshot } from "@/lib/validation";
import type { ReadinessBandDisplay, ConfidenceDisplay } from "@/lib/readiness-calibration";
import { confidenceDisplayLabel, readinessBandDisplayLabel } from "@/lib/readiness-calibration";

export type LearnerDashboardView = {
  firstName: string;
  hasReports: boolean;
  latest: {
    reportId: string;
    score: number;
    label: string;
    bandDisplay: ReadinessBandDisplay;
    confidenceLevel: number;
    confidenceDisplay: ConfidenceDisplay;
  } | null;
  trend: {
    previousScore: number | null;
    currentScore: number | null;
    delta: number | null;
  };
  testBooking: {
    testDate: string;
    daysRemaining: number;
    reportId: string;
  } | null;
  nextPriority: { title: string; detail: string; reportId: string | null } | null;
  roadmap: {
    topicsCovered: number;
    totalTopics: number;
    completionPercent: number;
    independentGap: string | null;
    manoeuvreGap: string | null;
  } | null;
  recentReports: ReportSummaryItem[];
  journeyInsights: string[];
  hasLifetimeAccess: boolean;
  snapshots: JourneySnapshot[];
};

function daysUntil(isoDate: string): number {
  const test = new Date(isoDate);
  if (Number.isNaN(test.getTime())) return 0;
  return Math.ceil((test.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function roadmapGaps(syllabus: SyllabusProgressSnapshot | null): {
  independentGap: string | null;
  manoeuvreGap: string | null;
} {
  if (!syllabus) return { independentGap: null, manoeuvreGap: null };
  const ind = syllabus.categoryProgress.find((c) => c.key === "independent_driving");
  const man = syllabus.categoryProgress.find((c) => c.key === "manoeuvres");
  return {
    independentGap:
      ind && ind.completionPercent < 50
        ? `Independent driving: ${ind.covered}/${ind.total} themes covered`
        : null,
    manoeuvreGap:
      man && man.completionPercent < 50
        ? `Manoeuvres: ${man.covered}/${man.total} themes covered`
        : null,
  };
}

function buildJourneyInsights(
  snapshots: JourneySnapshot[],
  roadmap: LearnerDashboardView["roadmap"],
): string[] {
  const insights: string[] = [];
  if (snapshots.length >= 2) {
    const first = snapshots[0]!.readiness_score;
    const last = snapshots[snapshots.length - 1]!.readiness_score;
    const totalDelta = last - first;
    if (totalDelta > 0) {
      insights.push(`You've improved ${totalDelta} points since your first assessment.`);
    } else if (totalDelta === 0) {
      insights.push("Your score has held steady across assessments, consistency is building.");
    }
  }
  if (roadmap && roadmap.completionPercent > 0) {
    insights.push(`You have completed ${roadmap.completionPercent}% of the learning roadmap.`);
  }
  const strongest = deriveStrongestPhrase(snapshots, snapshots[snapshots.length - 1] ?? null);
  if (strongest && !strongest.includes("Save a second report")) {
    const match = strongest.match(/^(.+?) has rarely|^(.+?) is not flagged|^(.+?) comes up less/);
    if (match) {
      const area = (match[1] ?? match[2] ?? match[3] ?? "").trim();
      if (area) insights.push(`Most improved area: ${area}.`);
    }
  }
  return insights.slice(0, 3);
}

export async function buildLearnerDashboardView(userId: string): Promise<LearnerDashboardView> {
  let firstName = "";
  try {
    const sb = createSupabaseServerClient();
    const {
      data: { user: full },
    } = await sb.auth.getUser();
    const md = full?.user_metadata as Record<string, unknown> | undefined;
    firstName =
      (typeof md?.first_name === "string" && md.first_name.trim()) ||
      (typeof md?.firstName === "string" && md.firstName.trim()) ||
      "";
  } catch {
    /* ignore */
  }

  const [snaps, entitlements, reports, testBooking] = await Promise.all([
    listJourneySnapshotsByUserId(userId),
    getEntitlementLookupForUser(userId),
    getReportsByUserId(userId),
    getLatestReportTestBooking(userId),
  ]);

  const latestReport = reports[0] ?? null;
  const delta = deriveDeltaVsPrior(snaps);
  const prevSnap = snaps.length >= 2 ? snaps[snaps.length - 2]! : null;
  const latestSnap = snaps.length ? snaps[snaps.length - 1]! : null;

  let latestBlock: LearnerDashboardView["latest"] = null;
  let roadmap: LearnerDashboardView["roadmap"] = null;
  let nextPriority: LearnerDashboardView["nextPriority"] = null;

  if (latestReport) {
    const model = buildReportViewModel({
      readinessScore: latestReport.readiness_score,
      readinessLabel: latestReport.readiness_label as ReadinessLabel,
      summary: latestReport.summary,
      nextSteps: latestReport.next_steps as string[],
      riskAreasRaw: latestReport.risk_areas,
      weakAreasRaw: latestReport.weak_areas,
      lessonsTaken: latestReport.lessons_taken,
      mockTestTaken: latestReport.mock_test_taken,
      mockTestResult: latestReport.mock_test_result as AssessmentPayload["mockTestResult"],
      seriousFaults: latestReport.serious_faults,
      drivingFaults: latestReport.driving_faults,
      confidenceLevel: latestReport.confidence_level,
      testBooked: latestReport.test_booked ? "yes" : "no",
      testDate: latestReport.test_date,
      rawMetadata: latestReport.raw_metadata,
      weakAreaDetailsRaw: latestReport.weak_area_details,
    });

    latestBlock = {
      reportId: latestReport.id,
      score: model.readinessScore,
      label: model.readinessLabel,
      bandDisplay: model.readinessBandDisplay,
      confidenceLevel: model.confidenceLevel,
      confidenceDisplay: model.confidenceDisplay,
    };

    if (model.syllabus) {
      const gaps = roadmapGaps(model.syllabus);
      roadmap = {
        topicsCovered: model.syllabus.topicsCoveredCount,
        totalTopics: model.syllabus.totalTopics,
        completionPercent: model.syllabus.completionPercent...gaps,
      };
    }

    const priority = model.topPriorities[0];
    if (priority) {
      nextPriority = {
        title: priority.title,
        detail: priority.detail,
        reportId: latestReport.id,
      };
    }
  }

  const recentReports = reports.slice(0, 3).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    readiness_score: r.readiness_score,
    readiness_label: r.readiness_label,
    report_source: r.report_source,
  }));

  const testBlock =
    testBooking?.testBooked && testBooking.testDate
      ? {
          testDate: testBooking.testDate,
          daysRemaining: daysUntil(testBooking.testDate),
          reportId: testBooking.reportId,
        }
      : null;

  return {
    firstName,
    hasReports: Boolean(latestReport),
    latest: latestBlock,
    trend: {
      previousScore: prevSnap?.readiness_score ?? null,
      currentScore: latestSnap?.readiness_score ?? null,
      delta,
    },
    testBooking: testBlock,
    nextPriority,
    roadmap,
    recentReports,
    journeyInsights: buildJourneyInsights(snaps, roadmap),
    hasLifetimeAccess: entitlements.hasLifetimeAccess,
    snapshots: snaps,
  };
}
