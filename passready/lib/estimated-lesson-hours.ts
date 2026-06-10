import { pickCopyVariant } from "@/lib/deterministic-report-copy";
import type { AssessmentPayload, EstimatedLessonHours, SyllabusProgressSnapshot } from "@/lib/validation";
import { productMeta, type WeakAreaId } from "@/lib/product-skill-map";

export const ESTIMATED_HOURS_TITLE = "Estimated hours to test readiness";

export const ESTIMATED_HOURS_SUPPORTING =
  "This estimate reflects remaining syllabus areas, identified weaknesses, and your reported experience.";

export const ESTIMATED_HOURS_DISCLAIMER = "This is a planning guide, not a guarantee.";

const BASE_GUIDED_HOURS = 10;
const PLANNING_RANGE_SPREAD = 5;

/** @deprecated Legacy estimation modes; retained for type compatibility. */
export type EstimationPath = "minimal" | "partial" | "full";

/** Inputs needed for hour estimation (subset of {@link AssessmentPayload}). */
export type EstimatedHoursInput = Pick<
  AssessmentPayload,
  | "lessonsTaken"
  | "mockTestTaken"
  | "mockTestResult"
  | "seriousFaults"
  | "drivingFaults"
  | "weakAreas"
  | "confidenceLevel"
  | "syllabusCaptureVersion"
  | "topicsCovered"
> &
  Partial<Pick<AssessmentPayload, "testBooked" | "testDate">> & {
    syllabus?: SyllabusProgressSnapshot | null;
  };

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function categoryPct(syllabus: SyllabusProgressSnapshot | null | undefined, key: string): number | null {
  const cat = syllabus?.categoryProgress.find((c) => c.key === key);
  if (!cat || cat.total <= 0) return null;
  return cat.completionPercent;
}

function independentDrivingHoursAdd(pct: number | null): number {
  if (pct == null) return 0;
  if (pct === 0) return 2;
  if (pct < 50) return 1;
  return 0;
}

function manoeuvresHoursAdd(pct: number | null): number {
  if (pct == null) return 0;
  if (pct <= 40) return 4;
  if (pct <= 79) return 2;
  return 0;
}

function weakAreaSeverityUnits(id: WeakAreaId): number {
  const tier = productMeta(id).riskTier;
  if (tier === "critical" || tier === "high") return 2;
  if (tier === "medium") return 1;
  return 1;
}

function weakAreaHoursAdd(input: EstimatedHoursInput): number {
  let add = 0;
  const weak = new Set(input.weakAreas);

  if (weak.has("junctions")) add += 1;
  if (weak.has("roundabouts")) add += Math.min(2, weakAreaSeverityUnits("roundabouts"));
  if (weak.has("independentDriving")) add += Math.min(2, weakAreaSeverityUnits("independentDriving"));

  if (input.confidenceLevel <= 4) add += 2;
  else if (input.confidenceLevel <= 6) add += 1;

  return add;
}

function mockTestHoursAdjust(input: EstimatedHoursInput): number {
  if (input.mockTestTaken !== "yes") return 0;

  if (input.mockTestResult === "fail") {
    const faultSignal = input.seriousFaults * 2 + Math.min(6, Math.floor(input.drivingFaults / 3));
    return clamp(2 + faultSignal, 2, 6);
  }

  if (input.mockTestResult === "pass") {
    const clean = input.seriousFaults === 0 && input.drivingFaults <= 5;
    const moderate = input.seriousFaults === 0 && input.drivingFaults <= 10;
    if (clean) return -4;
    if (moderate) return -2;
    return -1;
  }

  return 0;
}

/** Proxy when assessment form has no private-practice field: broad syllabus vs lesson ratio. */
function privatePracticeHoursAdjust(input: EstimatedHoursInput): number {
  const topics = input.topicsCovered?.length ?? 0;
  if (topics >= 18 && input.lessonsTaken >= 25) return -3;
  if (topics >= 14 && input.lessonsTaken >= 18) return -2;
  if (topics >= 10 && input.lessonsTaken >= 12) return -1;
  return 0;
}

function buildCalibratedHours(input: EstimatedHoursInput): EstimatedLessonHours {
  const indPct = categoryPct(input.syllabus, "independent_driving");
  const manPct = categoryPct(input.syllabus, "manoeuvres");

  let likely =
    BASE_GUIDED_HOURS +
    independentDrivingHoursAdd(indPct) +
    manoeuvresHoursAdd(manPct) +
    weakAreaHoursAdd(input) +
    mockTestHoursAdjust(input) +
    privatePracticeHoursAdjust(input);

  likely = clamp(Math.round(likely), 5, 45);

  const min = clamp(likely - PLANNING_RANGE_SPREAD, 0, likely);
  const max = likely + PLANNING_RANGE_SPREAD;

  return {
    min,
    max,
    likely,
    openEndedHigh: false,
  };
}

/**
 * Calibrated guided-hour estimate from roadmap gaps, weak areas, mock performance, and experience signals.
 */
export function computeEstimatedLessonHours(
  input: EstimatedHoursInput,
  _readinessScore?: number,
): EstimatedLessonHours {
  void _readinessScore;
  return buildCalibratedHours(input);
}

export function computeLikelyHours(hours: EstimatedLessonHours): number {
  if (hours.likely != null) return hours.likely;
  return Math.round((hours.min + hours.max) / 2);
}

export function computePlanningRange(hours: EstimatedLessonHours): { min: number; max: number } {
  const likely = computeLikelyHours(hours);
  return {
    min: clamp(likely - PLANNING_RANGE_SPREAD, 0, likely),
    max: likely + PLANNING_RANGE_SPREAD,
  };
}

export function formatEstimatedLessonHoursMainLine(hours: EstimatedLessonHours): string {
  const likely = computeLikelyHours(hours);
  const planning = computePlanningRange(hours);
  return `Most likely estimate: ${likely} hours. Planning range: ${planning.min}–${planning.max} hours.`;
}

/** @deprecated prefer formatEstimatedLessonHoursMainLine */
export function formatEstimatedLessonHoursLegacyLine(hours: EstimatedLessonHours): string {
  const likely = computeLikelyHours(hours);
  const planning = computePlanningRange(hours);
  return `You may need around ${planning.min} to ${planning.max} more hours of lessons (most likely ${likely})`;
}

export function hourBandPhrase(hours: EstimatedLessonHours): string {
  const planning = computePlanningRange(hours);
  return `${planning.min} to ${planning.max}`;
}

export function reportNarrativeSalt(reportId: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < reportId.length; i++) {
    h ^= reportId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function buildRecommendedHoursNarrative(hours: EstimatedLessonHours, salt: number): string {
  const likely = computeLikelyHours(hours);
  const planning = computePlanningRange(hours);
  return pickCopyVariant(salt, "hrs:narrative", [
    `Based on your assessment, around ${likely} additional guided hours may be a reasonable planning estimate. ${ESTIMATED_HOURS_SUPPORTING} Plan for ${planning.min}–${planning.max} hours depending on lesson frequency and instructor judgement.`,
    `Based on this assessment, around ${likely} additional guided hours may be a reasonable planning estimate. ${ESTIMATED_HOURS_SUPPORTING} A sensible planning range is ${planning.min}–${planning.max} hours.`,
    `Around ${likely} additional guided hours may be a reasonable planning estimate from this assessment. ${ESTIMATED_HOURS_SUPPORTING} Keep ${planning.min}–${planning.max} hours as a planning range, not a deadline.`,
  ]);
}
