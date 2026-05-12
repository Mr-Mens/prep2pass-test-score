import { pickCopyVariant, reportCopySalt } from "@/lib/deterministic-report-copy";
import type { AssessmentPayload, DeterministicReadinessResult, MockReadinessResult } from "@/lib/validation";

type Options = {
  source: "fallback" | "ai";
  model?: string;
  generatedAt?: string;
};

function fallbackCoachMessage(assessment: AssessmentPayload): string {
  const salt = reportCopySalt(assessment);
  const c = assessment.confidenceLevel;
  if (c <= 4) {
    return pickCopyVariant(salt, "coach:low", [
      "You are closer than it feels. Keep each lesson focused on one weak routine and track improvements weekly.",
      "Confidence is shaky on paper, but instructors often see faster gains when you repeat one narrow routine until it feels automatic.",
      "Pick one theme per lesson and measure it in plain English so progress is visible, not just how the drive felt.",
      "Low confidence is normal; pair short wins with your instructor and revisit the same junction types until they feel boring.",
    ]);
  }
  if (c <= 7) {
    return pickCopyVariant(salt, "coach:mid", [
      "Keep your routines calm and consistent. Solid basics under pressure usually matter more than perfect drives.",
      "Mid confidence is a good sign you are noticing risk; channel that into one repeatable habit per route, not wholesale changes.",
      "Let your instructor set the bar for “good enough” this week, then chase that bar twice on familiar roads.",
      "Steady beats flashy: tighten observations and default speeds before you chase new routes.",
    ]);
  }
  return pickCopyVariant(salt, "coach:high", [
    "Strong self-belief helps, but keep one mock near test week so confidence does not replace early observations.",
    "High confidence is useful if it stays disciplined: rehearse the boring bits so test day feels familiar, not lucky.",
    "Use your momentum to polish edge cases: busy roundabouts, tight gaps, and late instruction changes.",
    "Stay curious on easier drives; complacency is where small habits slip before test week.",
  ]);
}

export function deterministicToReport(
  assessment: AssessmentPayload,
  deterministic: DeterministicReadinessResult,
  options: Options = { source: "fallback" },
): MockReadinessResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  return {
    readinessScore: deterministic.readinessScore,
    readinessLabel: deterministic.readinessLabel,
    summary: deterministic.summary,
    riskAreas: deterministic.riskAreas,
    nextSteps: deterministic.nextSteps,
    recommendedHours: deterministic.recommendedHours,
    estimatedLessonHours: deterministic.estimatedLessonHours,
    coachMessage: fallbackCoachMessage(assessment),
    metadata: {
      source: options.source,
      model: options.model,
      generatedAt,
      ...(deterministic.syllabusProgress ? { syllabus: deterministic.syllabusProgress } : {}),
    },
  };
}
