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
    summary: deterministic.summary,
    riskAreas: deterministic.riskAreas,
    nextSteps: deterministic.nextSteps,
    recommendedHours: deterministic.recommendedHours,
    coachMessage:
      assessment.confidenceLevel <= 4
        ? "You are closer than it feels. Keep each lesson focused on one weak routine and track improvements weekly."
        : "Keep your routines calm and consistent. Solid basics under pressure usually matter more than perfect drives.",
    metadata: {
      source: options.source,
      model: options.model,
      generatedAt,
    },
  };
}
