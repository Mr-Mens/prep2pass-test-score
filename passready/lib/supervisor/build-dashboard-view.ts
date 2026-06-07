import "server-only";

import { WEAK_AREA_OPTIONS } from "@/lib/product-skill-map";
import {
  countReportsByUserId,
  getReportsByUserId,
  listJourneySnapshotsByUserId,
} from "@/lib/server/repositories/reports-repository";
import { deriveDeltaVsPrior } from "@/lib/dashboard/journey-insights";
import {
  getActiveLearnerLinkForParent,
  refreshLearnerLink,
} from "@/lib/server/repositories/parent-repository";
import { SYLLABUS_TOPIC_CATALOG, SYLLABUS_TOTAL_TOPIC_COUNT } from "@/lib/syllabus-topics";
import { syllabusProgressSnapshotSchema } from "@/lib/validation";

import type { SupervisorDashboardView, SupervisorTrend } from "@/lib/supervisor/types";

function labelForWeakArea(id: string): string {
  return WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id.replace(/([A-Z])/g, " $1").trim();
}

function trendFromDelta(delta: number | null): SupervisorTrend {
  if (delta === null) return "flat";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function syllabusFromRawMetadata(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const syllabus = (raw as { syllabus?: unknown }).syllabus;
  const parsed = syllabusProgressSnapshotSchema.safeParse(syllabus);
  return parsed.success ? parsed.data : null;
}

function buildSyllabusFromTopics(coveredIds: readonly string[]) {
  const covered = new Set(coveredIds);
  const categories = SYLLABUS_TOPIC_CATALOG.map((cat) => {
    const total = cat.items.length;
    const coveredCount = cat.items.filter((it) => covered.has(it.id)).length;
    const completionPercent = total > 0 ? Math.round((coveredCount / total) * 100) : 0;
    return {
      key: cat.key,
      title: cat.title,
      covered: coveredCount,
      total,
      completionPercent,
    };
  });
  const topicsCovered = coveredIds.length;
  const topicsRemaining = Math.max(0, SYLLABUS_TOTAL_TOPIC_COUNT - topicsCovered);
  const completionPercent =
    SYLLABUS_TOTAL_TOPIC_COUNT > 0 ? Math.round((topicsCovered / SYLLABUS_TOTAL_TOPIC_COUNT) * 100) : 0;

  return {
    completionPercent,
    topicsCovered,
    topicsRemaining,
    categories,
  };
}

function estimatePracticeMinutes(focusCount: number): number {
  if (focusCount <= 0) return 45;
  if (focusCount === 1) return 45;
  if (focusCount === 2) return 60;
  return 75;
}

export async function buildSupervisorDashboardView(parentUserId: string): Promise<SupervisorDashboardView> {
  let link = await getActiveLearnerLinkForParent(parentUserId);
  if (link && link.status === "pending") {
    link = (await refreshLearnerLink(link.id, parentUserId)) ?? link;
  }

  const emptyProgress = {
    currentScore: null,
    previousScore: null,
    improvement: null,
    trend: "flat" as SupervisorTrend,
    reportsCompleted: 0,
  };

  if (!link?.learner_user_id) {
    return {
      linkedLearner: link
        ? {
            linkId: link.id,
            name: link.learner_name?.trim() || link.learner_email,
            email: link.learner_email,
            status: link.status,
          }
        : null,
      latestScore: null,
      progressSummary: emptyProgress,
      practiceFocus: { items: [], estimatedMinutes: 45 },
      syllabusProgress: null,
    };
  }

  const learnerUserId = link.learner_user_id;
  const [snaps, reports, reportCount] = await Promise.all([
    listJourneySnapshotsByUserId(learnerUserId),
    getReportsByUserId(learnerUserId),
    countReportsByUserId(learnerUserId),
  ]);

  const latestSnap = snaps.length ? snaps[snaps.length - 1]! : null;
  const prevSnap = snaps.length >= 2 ? snaps[snaps.length - 2]! : null;
  const delta = deriveDeltaVsPrior(snaps);
  const latestReport = reports[0] ?? null;
  const learnerName =
    link.learner_name?.trim() ||
    latestReport?.full_name?.trim() ||
    link.learner_email.split("@")[0] ||
    "Your learner";

  const weakAreas = latestSnap?.weak_areas ?? latestReport?.weak_areas ?? [];
  const nextSteps = (latestReport?.next_steps as string[] | undefined) ?? [];
  const focusFromWeak = weakAreas.slice(0, 3).map(labelForWeakArea);
  const focusFromSteps = nextSteps.slice(0, 2);
  const focusItems = Array.from(new Set([...focusFromWeak, ...focusFromSteps])).slice(0, 3);

  const syllabusSnapshot = latestReport ? syllabusFromRawMetadata(latestReport.raw_metadata) : null;
  const syllabusProgress = syllabusSnapshot
    ? {
        completionPercent: syllabusSnapshot.completionPercent,
        topicsCovered: syllabusSnapshot.topicsCoveredCount,
        topicsRemaining: Math.max(0, syllabusSnapshot.totalTopics - syllabusSnapshot.topicsCoveredCount),
        categories: syllabusSnapshot.categoryProgress.map((c) => ({
          key: c.key,
          title: c.title,
          covered: c.covered,
          total: c.total,
          completionPercent: c.completionPercent,
        })),
      }
    : latestReport?.weak_areas?.length
      ? buildSyllabusFromTopics(latestReport.weak_areas)
      : null;

  if (syllabusSnapshot && focusItems.length < 3) {
    for (const label of syllabusSnapshot.uncoveredPriorityLabels) {
      if (focusItems.length >= 3) break;
      if (!focusItems.includes(label)) focusItems.push(label);
    }
  }

  return {
    linkedLearner: {
      linkId: link.id,
      name: learnerName,
      email: link.learner_email,
      status: link.status,
    },
    latestScore: latestSnap
      ? {
          learnerName,
          score: latestSnap.readiness_score,
          label: latestSnap.readiness_label,
          assessedAt: latestSnap.created_at,
        }
      : null,
    progressSummary: {
      currentScore: latestSnap?.readiness_score ?? null,
      previousScore: prevSnap?.readiness_score ?? null,
      improvement: delta,
      trend: trendFromDelta(delta),
      reportsCompleted: reportCount,
    },
    practiceFocus: {
      items: focusItems,
      estimatedMinutes: estimatePracticeMinutes(focusItems.length),
    },
    syllabusProgress,
  };
}
