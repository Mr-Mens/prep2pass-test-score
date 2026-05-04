import { sanitiseReportLearnerCopy } from "@/lib/report-copy-sanitise";
import { computeMockReadiness } from "@/lib/scoring";
import { generateReadinessReport } from "@/lib/server/generate-readiness-report";
import { deterministicToReport } from "@/lib/transformers/deterministic-to-report";
import type { AssessmentPayload, MockReadinessResult } from "@/lib/validation";

export type ScoreAssessmentResult = {
  assessment: AssessmentPayload;
  result: MockReadinessResult;
};

export type ScoreAssessmentOptions = {
  /**
   * When false, skip OpenAI (deterministic narrative only).
   * Use for free preview (`/api/assessment/score`) so paid `finalise` keeps quota for one AI call per purchase.
   */
  useAiEnrichment?: boolean;
};

/**
 * Server-side scoring entry point:
 * 1) deterministic score (always)
 * 2) attempt AI enrichment (optional; on by default for paid finalise)
 * 3) fallback to deterministic narrative when AI fails/misconfigured
 */
export async function scoreAssessment(
  assessment: AssessmentPayload,
  options: ScoreAssessmentOptions = {},
): Promise<ScoreAssessmentResult> {
  const deterministic = computeMockReadiness(assessment);

  if (options.useAiEnrichment === false) {
    return {
      assessment,
      result: sanitiseReportLearnerCopy(deterministicToReport(assessment, deterministic, { source: "fallback" })),
    };
  }

  try {
    const aiReport = await generateReadinessReport({ assessment, deterministic });
    const result: MockReadinessResult = {
      readinessScore: deterministic.readinessScore,
      readinessLabel: deterministic.readinessLabel,
      summary: aiReport.summary,
      riskAreas: aiReport.riskAreas,
      nextSteps: aiReport.nextSteps,
      recommendedHours: deterministic.recommendedHours,
      estimatedLessonHours: deterministic.estimatedLessonHours,
      coachMessage: aiReport.coachMessage,
      metadata: {
        source: "ai",
        model: aiReport.model,
        generatedAt: new Date().toISOString(),
      },
    };
    return { assessment, result: sanitiseReportLearnerCopy(result) };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn("[assessment] AI enrichment failed, using deterministic copy:", reason);
    const result = deterministicToReport(assessment, deterministic, { source: "fallback" });
    return { assessment, result: sanitiseReportLearnerCopy(result) };
  }
}
