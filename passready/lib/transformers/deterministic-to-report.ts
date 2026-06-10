import { buildFallbackCoachMessage, buildFallbackDebrief } from "@/lib/fallback-adi-narrative";
import type { AssessmentPayload, DeterministicReadinessResult, MockReadinessResult } from "@/lib/validation";

type Options = {
  source: "fallback" | "ai";
  model?: string;
  generatedAt?: string;
};

export function deterministicToReport(
  assessment: AssessmentPayload,
  deterministic: DeterministicReadinessResult,
  options: Options = { source: "fallback" },
): MockReadinessResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  return {
    readinessScore: deterministic.readinessScore,
    readinessLabel: deterministic.readinessLabel,
    summary: buildFallbackDebrief(assessment, deterministic),
    riskAreas: deterministic.riskAreas,
    nextSteps: deterministic.nextSteps,
    recommendedHours: deterministic.recommendedHours,
    estimatedLessonHours: deterministic.estimatedLessonHours,
    coachMessage: buildFallbackCoachMessage(assessment, deterministic),
    metadata: {
      source: options.source,
      model: options.model,
      generatedAt,
      ...(deterministic.syllabusProgress ? { syllabus: deterministic.syllabusProgress } : {}),
    },
  };
}
