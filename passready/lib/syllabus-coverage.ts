import { pickCopyVariant } from "@/lib/deterministic-report-copy";
import type { AssessmentPayload, EstimatedLessonHours } from "@/lib/validation";

import {
  SYLLABUS_TOPIC_CATALOG,
  SYLLABUS_TOTAL_TOPIC_COUNT,
  syllabusTopicLabel,
  syllabusUrgencyScore,
} from "@/lib/syllabus-topics";

export function syllabusLayerActive(assessment: AssessmentPayload): boolean {
  return assessment.syllabusCaptureVersion === 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function ensureMinLessonRange(min: number, max: number): { min: number; max: number } {
  if (max <= min) return { min, max: min + 2 };
  return { min, max };
}

function clampLessonBand(min: number, max: number, openEndedHigh: boolean): EstimatedLessonHours {
  let m = Math.max(0, Math.min(min, 92));
  let M = Math.max(m + 2, Math.min(max, 96));
  if (M <= m) M = m + 2;
  return { min: m, max: M, openEndedHigh };
}

/** Weighted 0–1 familiarity; not ability. */
export function computeWeightedSyllabusRatio(coveredIds: readonly string[]): number {
  let totalW = 0;
  let hitW = 0;
  const hit = new Set(coveredIds);
  for (const cat of SYLLABUS_TOPIC_CATALOG) {
    for (const it of cat.items) {
      totalW += it.weight;
      if (hit.has(it.id)) hitW += it.weight;
    }
  }
  if (totalW <= 0) return 1;
  return clamp(hitW / totalW, 0, 1);
}

export function blendReadinessWithSyllabus(pillarScore: number, weightedRatio: number): number {
  const r = clamp(weightedRatio, 0, 1);
  const eased = Math.pow(r, 0.88);
  const softCap = 34 + 66 * eased;
  const scaled = pillarScore * (0.72 + 0.28 * r);
  const blended = Math.min(scaled, softCap);
  return clamp(Math.round(blended), 0, 100);
}

export function boostLessonHoursForSyllabusGaps(
  hours: EstimatedLessonHours,
  weightedRatio: number,
): EstimatedLessonHours {
  const gap = clamp(1 - weightedRatio, 0, 1);
  if (gap < 0.04) return hours;
  const boost = Math.pow(gap, 1.06);
  const addMin = Math.round(7 + 20 * boost);
  const addMax = Math.round(11 + 32 * boost);
  const spread = ensureMinLessonRange(hours.min + addMin, hours.max + addMax);
  return clampLessonBand(spread.min, spread.max, hours.openEndedHigh);
}

export type SyllabusCategoryProgress = {
  key: string;
  title: string;
  covered: number;
  total: number;
  completionPercent: number;
};

export type SyllabusProgressSnapshot = {
  captureVersion: 1;
  topicsCoveredCount: number;
  totalTopics: number;
  completionPercent: number;
  weightedCoverageRatio: number;
  categoryProgress: SyllabusCategoryProgress[];
  uncoveredPriorityLabels: string[];
  nextLessonFocus: string[];
};

function categoryProgressSnapshot(covered: Set<string>): SyllabusCategoryProgress[] {
  return SYLLABUS_TOPIC_CATALOG.map((cat) => {
    const items = [...cat.items];
    const cov = items.filter((i) => covered.has(i.id)).length;
    const total = items.length;
    const completionPercent = total > 0 ? Math.round((cov / total) * 100) : 100;
    return {
      key: cat.key,
      title: cat.title,
      covered: cov,
      total,
      completionPercent,
    };
  });
}

function pickUncoveredPriority(covered: Set<string>, limit: number): string[] {
  const missing: { id: string; score: number }[] = [];
  for (const cat of SYLLABUS_TOPIC_CATALOG) {
    for (const it of cat.items) {
      if (covered.has(it.id)) continue;
      missing.push({
        id: it.id,
        score: it.weight * 2 + syllabusUrgencyScore(it.id),
      });
    }
  }
  missing.sort((a, b) => b.score - a.score);
  return missing.slice(0, limit).map((m) => syllabusTopicLabel(m.id));
}

export function buildSyllabusProgressSnapshot(assessment: AssessmentPayload): SyllabusProgressSnapshot | null {
  if (!syllabusLayerActive(assessment)) return null;

  const coveredArr = assessment.topicsCovered ?? [];
  const coveredSet = new Set(coveredArr);
  const weighted = computeWeightedSyllabusRatio(coveredArr);

  const catSnap = categoryProgressSnapshot(coveredSet);
  const simplePct =
    SYLLABUS_TOTAL_TOPIC_COUNT > 0 ? Math.round((coveredArr.length / SYLLABUS_TOTAL_TOPIC_COUNT) * 100) : 0;

  const priority = pickUncoveredPriority(coveredSet, 11);
  const nextFocus = priority.slice(0, 6);

  return {
    captureVersion: 1,
    topicsCoveredCount: coveredArr.length,
    totalTopics: SYLLABUS_TOTAL_TOPIC_COUNT,
    completionPercent: simplePct,
    weightedCoverageRatio: weighted,
    categoryProgress: catSnap,
    uncoveredPriorityLabels: priority,
    nextLessonFocus: nextFocus,
  };
}

/** Short deterministic steps syllable-matched for prompts (prepended ahead of richer steps). */
export function buildSyllabusFocusSteps(assessment: AssessmentPayload, salt: number): string[] {
  if (!syllabusLayerActive(assessment)) return [];
  const snap = buildSyllabusProgressSnapshot(assessment);
  if (!snap || snap.nextLessonFocus.length === 0) return [];

  const focusShort = snap.nextLessonFocus.slice(0, 3).join(", ");
  const pct = snap.completionPercent;
  const lineA = pickCopyVariant(salt, "syl:focus", [
    `Roadmap snapshot: roughly ${pct}% of the syllabus checklist (${snap.topicsCoveredCount}/${snap.totalTopics}) is marked as practised. Next lessons deserve time on ${focusShort}.`,
    `You flagged ${snap.topicsCoveredCount}/${snap.totalTopics} syllabus topics (${pct}%). Book near-term practise on ${focusShort} until breadth catches up.`,
    `${pct}% of the roadmap is checked off here. Spend upcoming drives weaving ${focusShort} with your ADI.`,
  ]);

  let lineB: string | null = null;
  if (snap.uncoveredPriorityLabels.length >= 2) {
    const pair = `${snap.uncoveredPriorityLabels[0]} and ${snap.uncoveredPriorityLabels[1]}`;
    lineB = pickCopyVariant(salt, "syl:pair", [
      `Largest syllabus gaps spotted now include ${pair}. Short repeats beat long theory.`,
      `${pair} still read as unexplored roadmap items. Sandwich them across the next bookings.`,
      `Before chasing polish, earmark sessions for ${pair} so examiner-style routes feel reachable.`,
    ]);
  }

  return lineB ? [lineA, lineB] : [lineA];
}

/** Breadth bullets so next steps mirror more of the backlog than headline duo alone. */
export function buildSyllabusRoadmapSteps(assessment: AssessmentPayload, salt: number): string[] {
  if (!syllabusLayerActive(assessment)) return [];

  const snap = buildSyllabusProgressSnapshot(assessment);
  if (!snap || snap.uncoveredPriorityLabels.length < 4) return [];

  const thinning = [...snap.categoryProgress]
    .filter((c) => c.covered < c.total)
    .sort((a, b) => b.total - b.covered - (a.total - a.covered));

  const named = thinning
    .slice(0, 2)
    .map((c) => `${c.title} (${c.total - c.covered} still unchecked)`)
    .join("; ");

  const backlog = snap.uncoveredPriorityLabels.slice(4, 11);
  if (!named || backlog.length < 3) return [];

  const catLine = pickCopyVariant(salt, "syl:roadCats", [
    `Rotate practise across thinning pillars too: highlight ${named} so examiner-style breadth does not wait until your test week.`,
    `Balance upcoming lessons across ${named}, not only the top two syllabus buzzwords on the recap card.`,
    `Keep routing variety honest: earmark drives that deliberately touch ${named} before chasing polish elsewhere.`,
  ]);

  const joined = backlog.join(", ");
  const backlogLine = pickCopyVariant(salt, "syl:roadBack", [
    `Backlog themes after the urgency list stays busy with ${joined}, weave small reps into journeys you already use.`,
    `Further roadmap gaps worth threading in soon: ${joined}. Tiny repeats across normal lessons beat cramming.`,
    `Do not orphan these roadmap items deep into prep: ${joined} deserves light contact now so they stop feeling hypothetical.`,
  ]);

  return [catLine, backlogLine];
}

export function mergeNextStepsPreserveOrder(
  syllabusFirst: readonly string[],
  rest: readonly string[],
  max: number,
): string[] {
  return [...syllabusFirst, ...rest].filter((step, idx, arr) => arr.indexOf(step) === idx).slice(0, max);
}

export function appendSyllabusSentenceToSummary(
  baseSummary: string,
  assessment: AssessmentPayload,
  salt: number,
): string {
  if (!syllabusLayerActive(assessment)) return baseSummary;
  const snap = buildSyllabusProgressSnapshot(assessment);
  if (!snap) return baseSummary;

  const extra = pickCopyVariant(salt, "sum:syl", [
    ` You told us roughly ${snap.completionPercent}% of the learner roadmap (${snap.topicsCoveredCount}/${snap.totalTopics} syllabus topics) aligns with practise so far, trimming how boldly headline readiness can land before breadth catches up.`,
    ` Checklist breadth is about ${snap.completionPercent}% (${snap.topicsCoveredCount}/${snap.totalTopics} themes), reminding us familiarity with syllabus coverage is distinct from examiner-level mastery.`,
    ` Self-reported syllabus coverage lands near ${snap.completionPercent}% (${snap.topicsCoveredCount}/${snap.totalTopics}); keep that humility in the cockpit while you deepen skills coaches already flagged.`,
  ]);
  return `${baseSummary}${extra}`;
}
