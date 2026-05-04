import { pickCopyVariant } from "@/lib/deterministic-report-copy";
import type { AssessmentPayload, EstimatedLessonHours } from "@/lib/validation";
import { isManoeuvreWeakArea, type WeakAreaId } from "@/lib/product-skill-map";

export const ESTIMATED_HOURS_TITLE = "Estimated hours to test readiness";

export const ESTIMATED_HOURS_SUPPORTING =
  "Most learners need a spread of guided hours before test standard. This band is a planning guide, not a promise about how fast you will progress.";

export const ESTIMATED_HOURS_DISCLAIMER = "This is a guide, not a guarantee.";

/** Inputs needed for hour estimation (subset of {@link AssessmentPayload}). */
export type EstimatedHoursInput = Pick<
  AssessmentPayload,
  "lessonsTaken" | "mockTestTaken" | "mockTestResult" | "seriousFaults" | "drivingFaults" | "weakAreas" | "confidenceLevel"
>;

export type EstimationPath = "minimal" | "partial" | "full";

/**
 * Which deterministic path applies. Not shown in the UI; keeps copy consistent while allowing sparse data.
 *
 * - **full**: mock taken or any fault count above zero → use readiness score + fault/weak adjustments.
 * - **partial**: otherwise weak areas or very low / very high self-rated confidence → DVSA-style baseline plus light tweaks.
 * - **minimal**: only lessons + mid confidence, no mock/fault/weak signals → DVSA public planning band vs lessons taken.
 */
export function resolveEstimationPath(input: EstimatedHoursInput): EstimationPath {
  if (input.mockTestTaken === "yes" || input.seriousFaults > 0 || input.drivingFaults > 0) return "full";
  if (input.weakAreas.length > 0 || input.confidenceLevel <= 3 || input.confidenceLevel >= 9) return "partial";
  return "minimal";
}

function clampBand(min: number, max: number, openEndedHigh: boolean): EstimatedLessonHours {
  let m = Math.max(0, Math.min(min, 72));
  let M = Math.max(m + 2, Math.min(max, 78));
  if (M <= m) M = m + 2;
  return { min: m, max: M, openEndedHigh };
}

function ensureMinRange(min: number, max: number): { min: number; max: number } {
  if (max <= min) return { min, max: min + 2 };
  return { min, max };
}

/** DVSA public messaging often quotes a wide band of typical guided hours before test; we use it when fault/mock data is absent. */
const DVSA_TYPICAL_TOTAL_MIN = 35;
const DVSA_TYPICAL_TOTAL_MAX = 45;

/**
 * Minimal path: remaining hours ≈ typical total band minus lessons already taken.
 * If the learner is already past the upper planning band, return a small “polish / maintenance” band.
 */
function estimateMinimal(lessonsTaken: number): EstimatedLessonHours {
  let min = Math.max(0, DVSA_TYPICAL_TOTAL_MIN - lessonsTaken);
  let max = Math.max(0, DVSA_TYPICAL_TOTAL_MAX - lessonsTaken);
  if (max === 0 && min === 0 && lessonsTaken >= DVSA_TYPICAL_TOTAL_MIN - 5) {
    return clampBand(0, 10, false);
  }
  const spread = ensureMinRange(min, Math.max(max, min + 2));
  return clampBand(spread.min, spread.max, false);
}

/** Partial path: same baseline as minimal, then nudge for weak-area count and confidence extremes. */
function estimatePartial(input: EstimatedHoursInput): EstimatedLessonHours {
  const base = estimateMinimal(input.lessonsTaken);
  let min = base.min;
  let max = base.max;
  const w = input.weakAreas.length;
  min += Math.min(10, w * 2);
  max += Math.min(16, 4 + Math.round(w * 2.5));
  const c = input.confidenceLevel;
  if (c <= 3) {
    min += 2;
    max += 6;
  }
  if (c >= 9) {
    min = Math.max(0, min - 1);
    max = Math.max(min + 2, max - 4);
  }
  return clampBand(min, max, false);
}

function baseBandFromScore(score: number): EstimatedLessonHours {
  if (score >= 80) return { min: 0, max: 5, openEndedHigh: false };
  if (score >= 65) return { min: 5, max: 12, openEndedHigh: false };
  if (score >= 50) return { min: 10, max: 20, openEndedHigh: false };
  if (score >= 35) return { min: 15, max: 30, openEndedHigh: false };
  return { min: 25, max: 45, openEndedHigh: true };
}

function parkingOnlyWeakAreas(weakAreas: readonly WeakAreaId[]): boolean {
  return weakAreas.length > 0 && weakAreas.every((id) => isManoeuvreWeakArea(id));
}

function hasCoreMirrorsOrJunctions(weakAreas: readonly WeakAreaId[]): boolean {
  return weakAreas.some((id) => id === "mirrors" || id === "junctions");
}

/** Full path: readiness score is primary; faults and weak areas apply capped adjustments (existing behaviour). */
function estimateFull(input: EstimatedHoursInput, readinessScore: number): EstimatedLessonHours {
  const base = baseBandFromScore(readinessScore);
  let min = base.min;
  let max = base.max;
  const openEndedHigh = base.openEndedHigh;

  const weak = input.weakAreas;
  const parkingOnly = parkingOnlyWeakAreas(weak);
  const scale = parkingOnly ? 0.45 : 1;

  const rawSeriousMin = input.seriousFaults * 4;
  const rawSeriousMax = input.seriousFaults * 8;
  const seriousMin = Math.min(Math.round(rawSeriousMin * scale), 18);
  const seriousMax = Math.min(Math.round(rawSeriousMax * scale), 24);
  min += seriousMin;
  max += seriousMax;

  if (input.drivingFaults > 8) {
    const dm = Math.round(3 * scale);
    const dM = Math.round(6 * scale);
    min += dm;
    max += dM;
  }

  if (hasCoreMirrorsOrJunctions(weak)) {
    if (!parkingOnly) {
      min += 3;
      max += 6;
    } else {
      min += 1;
      max += 2;
    }
  }

  const maxUplift = 34;
  const uplift = Math.max(0, max - base.max);
  const upliftMin = Math.max(0, min - base.min);
  const combined = Math.max(uplift, upliftMin);
  if (combined > maxUplift) {
    const factor = maxUplift / combined;
    min = base.min + Math.round((min - base.min) * factor);
    max = base.max + Math.round((max - base.max) * factor);
  }

  const spread = ensureMinRange(min, max);
  return clampBand(spread.min, spread.max, openEndedHigh);
}

/**
 * Deterministic hour band. Chooses minimal / partial / full from available signals; never exposes the mode in copy.
 *
 * Examples (deterministic): minimal ~35–45 total minus lessons; partial adds weak-area and confidence nudges; full uses score bands plus fault tweaks.
 */
export function computeEstimatedLessonHours(
  input: EstimatedHoursInput,
  readinessScore: number,
): EstimatedLessonHours {
  const path = resolveEstimationPath(input);
  if (path === "full") return estimateFull(input, readinessScore);
  if (path === "partial") return estimatePartial(input);
  return estimateMinimal(input.lessonsTaken);
}

export function formatEstimatedLessonHoursMainLine(hours: EstimatedLessonHours): string {
  const hi = hours.openEndedHigh ? `${hours.max}+` : String(hours.max);
  return `You may need around ${hours.min} to ${hi} more hours of lessons`;
}

export function hourBandPhrase(hours: EstimatedLessonHours): string {
  if (hours.openEndedHigh) return `${hours.min} to ${hours.max} or more`;
  return `${hours.min} to ${hours.max}`;
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
  const band = hourBandPhrase(hours);
  return pickCopyVariant(salt, "hrs:narrative", [
    `Plan roughly ${band} more lesson hours with your ADI, spread across normal sessions rather than one block. Aim most of that time at the risk areas in this report, and add a mock when your instructor agrees you are close to test standard.`,
    `Use about ${band} more guided hours as a working budget with your instructor. Week by week, tie each lesson to one or two themes from this report, then revisit your readiness before you lock your test.`,
    `Think of ${band} more hours as a realistic band, not a deadline. Let your instructor pace it around what they see on the road, and slot a mock once the themes that worry you both feel under control.`,
  ]);
}
