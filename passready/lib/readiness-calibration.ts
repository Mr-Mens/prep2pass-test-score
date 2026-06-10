import { computeLikelyHours } from "@/lib/estimated-lesson-hours";
import type { AssessmentPayload, EstimatedLessonHours, ReadinessLabel, SyllabusProgressSnapshot } from "@/lib/validation";

/** User-facing band names (stored {@link ReadinessLabel} may differ for legacy reports). */
export type ReadinessBandDisplay =
  | "Early Stage"
  | "Developing"
  | "Approaching Test Standard"
  | "Nearly Test Ready"
  | "Test Ready";

export type ConfidenceDisplay = "Low" | "Moderate" | "High";

const APPROACHING_TEST_STANDARD_MAX_SCORE = 74;
const NEARLY_TEST_READY_MIN_SCORE = 75;

export function labelForScore(score: number): ReadinessLabel {
  if (score <= 39) return "Needs More Time";
  if (score <= 59) return "Building Consistency";
  if (score <= 74) return "Building Consistency";
  if (score <= 84) return "Nearly Test Ready";
  return "Test Ready";
}

export function readinessBandDisplayLabel(
  label: ReadinessLabel,
  score: number,
): ReadinessBandDisplay {
  if (label === "Needs More Time") return "Early Stage";
  if (label === "Nearly Test Ready") return "Nearly Test Ready";
  if (label === "Test Ready") return "Test Ready";
  return score >= 60 ? "Approaching Test Standard" : "Developing";
}

export function confidenceDisplayLabel(level: number): ConfidenceDisplay {
  if (level <= 4) return "Low";
  if (level <= 7) return "Moderate";
  return "High";
}

function categoryCompletion(
  syllabus: SyllabusProgressSnapshot | null | undefined,
  key: string,
): number | null {
  const cat = syllabus?.categoryProgress.find((c) => c.key === key);
  if (!cat || cat.total <= 0) return null;
  return cat.completionPercent;
}

export function hasIndependentDrivingGap(syllabus: SyllabusProgressSnapshot | null | undefined): boolean {
  const pct = categoryCompletion(syllabus, "independent_driving");
  return pct != null && pct < 50;
}

export function hasManoeuvreGap(syllabus: SyllabusProgressSnapshot | null | undefined): boolean {
  const pct = categoryCompletion(syllabus, "manoeuvres");
  return pct != null && pct < 50;
}

export function hasMajorRoadmapGaps(syllabus: SyllabusProgressSnapshot | null | undefined): boolean {
  return hasIndependentDrivingGap(syllabus) || hasManoeuvreGap(syllabus);
}

/** Cap numeric score when syllabus pillars are thin (max Approaching Test Standard). */
export function applyRoadmapReadinessScoreCeiling(
  score: number,
  assessment: Pick<AssessmentPayload, "syllabusCaptureVersion">,
  syllabus: SyllabusProgressSnapshot | null | undefined,
): number {
  if (assessment.syllabusCaptureVersion !== 1 || !syllabus) return score;
  if (!hasMajorRoadmapGaps(syllabus)) return score;
  return Math.min(score, APPROACHING_TEST_STANDARD_MAX_SCORE);
}

export type ReconciledReadiness = {
  score: number;
  label: ReadinessLabel;
  displayBand: ReadinessBandDisplay;
};

/**
 * Align stored label/score with roadmap gaps and hour estimate before persisting or displaying.
 */
export function reconcileReadinessOutcome(input: {
  score: number;
  label: ReadinessLabel;
  estimatedHours: EstimatedLessonHours;
  assessment: Pick<AssessmentPayload, "syllabusCaptureVersion">;
  syllabus: SyllabusProgressSnapshot | null | undefined;
}): ReconciledReadiness {
  let score = applyRoadmapReadinessScoreCeiling(input.score, input.assessment, input.syllabus);
  let label = labelForScore(score);
  const likelyHours = computeLikelyHours(input.estimatedHours);

  const indPct = categoryCompletion(input.syllabus, "independent_driving");
  const manPct = categoryCompletion(input.syllabus, "manoeuvres");
  const indZero = indPct === 0;
  const manThin = manPct != null && manPct <= 40;

  const blockTopBands =
    likelyHours > 25 ||
    indZero ||
    manThin ||
    hasMajorRoadmapGaps(input.syllabus);

  if (blockTopBands && (label === "Nearly Test Ready" || label === "Test Ready")) {
    score = Math.min(score, APPROACHING_TEST_STANDARD_MAX_SCORE);
    label = labelForScore(score);
  }

  if (hasMajorRoadmapGaps(input.syllabus)) {
    score = Math.min(score, APPROACHING_TEST_STANDARD_MAX_SCORE);
    label = labelForScore(score);
  }

  return {
    score,
    label,
    displayBand: readinessBandDisplayLabel(label, score),
  };
}

/** Ordered bands for product copy and debugging. */
export const READINESS_SCORE_LABEL_GUIDE = [
  { maxScore: 39, label: "Needs More Time" as const, display: "Early Stage" as const },
  { maxScore: 59, label: "Building Consistency" as const, display: "Developing" as const },
  { maxScore: 74, label: "Building Consistency" as const, display: "Approaching Test Standard" as const },
  { maxScore: 84, label: "Nearly Test Ready" as const, display: "Nearly Test Ready" as const },
  { maxScore: 100, label: "Test Ready" as const, display: "Test Ready" as const },
] as const;

export function readinessVerdictForScore(label: ReadinessLabel, score: number): string {
  const display = readinessBandDisplayLabel(label, score);
  switch (display) {
    case "Early Stage":
      return "you are still building foundations and not close to test ready yet";
    case "Developing":
      return "you are developing well but not test ready yet";
    case "Approaching Test Standard":
      return "you are approaching test standard";
    case "Nearly Test Ready":
      return "you are nearly test ready";
    case "Test Ready":
      return "you are test ready on current evidence, but silly mistakes and pressure still matter";
  }
}

export { APPROACHING_TEST_STANDARD_MAX_SCORE, NEARLY_TEST_READY_MIN_SCORE };
