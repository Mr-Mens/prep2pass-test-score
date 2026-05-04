import { pickCopyVariant } from "@/lib/deterministic-report-copy";
import type { AssessmentPayload, EstimatedLessonHours } from "@/lib/validation";
import { isManoeuvreWeakArea, type WeakAreaId } from "@/lib/product-skill-map";

export const ESTIMATED_HOURS_TITLE = "Estimated hours to test readiness";

export const ESTIMATED_HOURS_SUPPORTING =
  "Based on your current level, most learners need a few more lessons to build consistency before test standard.";

export const ESTIMATED_HOURS_DISCLAIMER = "This is a guide, not a guarantee.";

function baseBand(score: number): EstimatedLessonHours {
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

/**
 * Deterministic instructor-style range: readiness score drives the band; serious faults, high
 * driving-fault counts, and core weak areas (mirrors/junctions) add capped adjustments. Parking-only
 * weak-area selections apply minimal uplift.
 */
export function computeEstimatedLessonHours(
  assessment: Pick<AssessmentPayload, "seriousFaults" | "drivingFaults" | "weakAreas">,
  readinessScore: number,
): EstimatedLessonHours {
  const base = baseBand(readinessScore);
  let min = base.min;
  let max = base.max;
  const openEndedHigh = base.openEndedHigh;

  const weak = assessment.weakAreas;
  const parkingOnly = parkingOnlyWeakAreas(weak);
  const scale = parkingOnly ? 0.45 : 1;

  // Serious faults: +4–8 each, total capped (deterministic midpoint spread per fault).
  const rawSeriousMin = assessment.seriousFaults * 4;
  const rawSeriousMax = assessment.seriousFaults * 8;
  const seriousMin = Math.min(Math.round(rawSeriousMin * scale), 18);
  const seriousMax = Math.min(Math.round(rawSeriousMax * scale), 24);
  min += seriousMin;
  max += seriousMax;

  // High driving faults (>8): +3–6 hours (widen range).
  if (assessment.drivingFaults > 8) {
    const dm = Math.round(3 * scale);
    const dM = Math.round(6 * scale);
    min += dm;
    max += dM;
  }

  // Core weak areas (mirrors/junctions): +3–6 once if present (not stacked per area).
  if (hasCoreMirrorsOrJunctions(weak)) {
    if (!parkingOnly) {
      min += 3;
      max += 6;
    } else {
      min += 1;
      max += 2;
    }
  }

  // Cap combined uplift from adjustments above the score band (keeps estimates grounded).
  const maxUplift = 34;
  const uplift = Math.max(0, max - base.max);
  const upliftMin = Math.max(0, min - base.min);
  const combined = Math.max(uplift, upliftMin);
  if (combined > maxUplift) {
    const factor = maxUplift / combined;
    min = base.min + Math.round((min - base.min) * factor);
    max = base.max + Math.round((max - base.max) * factor);
  }

  if (max <= min) max = min + 2;

  min = Math.max(0, Math.min(min, 72));
  max = Math.max(min + 2, Math.min(max, 78));

  return { min, max, openEndedHigh };
}

export function formatEstimatedLessonHoursMainLine(hours: EstimatedLessonHours): string {
  const hi = hours.openEndedHigh ? `${hours.max}+` : String(hours.max);
  return `You may need around ${hours.min} to ${hi} more hours of lessons`;
}

/** Same numbers as the headline estimate, for the "Lesson guidance" narrative (no second band). */
export function hourBandPhrase(hours: EstimatedLessonHours): string {
  if (hours.openEndedHigh) return `${hours.min} to ${hours.max} or more`;
  return `${hours.min} to ${hours.max}`;
}

/**
 * Instructor-style paragraph tied to {@link computeEstimatedLessonHours} so it never contradicts the headline range.
 */
/** Stable salt for saved reports when full assessment is not loaded (variant only; band is unchanged). */
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
