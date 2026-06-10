import { polishAdiCopy } from "@/lib/adi-narrative";
import type { MockReadinessResult } from "./validation";

/**
 * Learner-facing copy: no em dash or en dash characters; keeps trust tone consistent with ADI-led guidance.
 */
function fixLearnerPunctuation(t: string): string {
  return polishAdiCopy(
    t
      .replace(/\u2014/g, ", ")
      .replace(/\u2013/g, " to ")
      .replace(/\s+,/g, ",")
      .replace(/,\s*,/g, ",")
      .replace(/  +/g, " ")
      .trim(),
  );
}

export function sanitiseReportLearnerCopy(result: MockReadinessResult): MockReadinessResult {
  return {
    ...result,
    summary: fixLearnerPunctuation(result.summary),
    coachMessage: fixLearnerPunctuation(result.coachMessage),
    recommendedHours: fixLearnerPunctuation(result.recommendedHours),
    nextSteps: result.nextSteps.map(fixLearnerPunctuation),
    riskAreas: result.riskAreas.map((b) => ({
      ...b,
      summary: fixLearnerPunctuation(b.summary),
      highlights: b.highlights?.map(fixLearnerPunctuation),
    })),
  };
}
