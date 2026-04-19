import { computeMockReadiness } from "@/lib/scoring";
import { generateReadinessReport } from "@/lib/server/generate-readiness-report";
import { deterministicToReport } from "@/lib/transformers/deterministic-to-report";
import type { AssessmentPayload, MockReadinessResult } from "@/lib/validation";

export type ScoreAssessmentResult = {
  assessment: AssessmentPayload;
  result: MockReadinessResult;
};

/**
 * Server-side scoring entry point:
 * 1) deterministic score (always)
 * 2) attempt AI enrichment
 * 3) fallback to deterministic narrative when AI fails/misconfigured
 */
export async function scoreAssessment(assessment: AssessmentPayload): Promise<ScoreAssessmentResult> {
  const deterministic = computeMockReadiness(assessment);

  try {
    const aiReport = await generateReadinessReport({ assessment, deterministic });
    const result: MockReadinessResult = {
      readinessScore: deterministic.readinessScore,
      readinessLabel: deterministic.readinessLabel,
      summary: aiReport.summary,
      riskAreas: aiReport.riskAreas,
      nextSteps: aiReport.nextSteps,
      recommendedHours: aiReport.recommendedHours,
      coachMessage: aiReport.coachMessage,
      metadata: {
        source: "ai",
        model: aiReport.model,
        generatedAt: new Date().toISOString(),
      },
    };
    return { assessment, result };
  } catch {
    const result = deterministicToReport(assessment, deterministic, { source: "fallback" });
    return { assessment, result };
  }
}
