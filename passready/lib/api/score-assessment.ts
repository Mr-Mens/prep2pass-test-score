import { ApiRequestError } from "@/lib/errors";
import {
  assessmentScoreErrorResponseSchema,
  assessmentScoreSuccessResponseSchema,
  type AssessmentPayload,
  type AssessmentScoreApiSuccess,
} from "@/lib/validation";

/**
 * POSTs a normalised assessment to the scoring API and returns the server result.
 * Safe to call from client components only.
 */
export async function requestAssessmentScore(
  assessment: AssessmentPayload,
): Promise<AssessmentScoreApiSuccess> {
  const res = await fetch("/api/assessment/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assessment),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from server", { status: res.status });
  }

  if (!res.ok) {
    const errParsed = assessmentScoreErrorResponseSchema.safeParse(raw);
    const message =
      errParsed.success && errParsed.data.error.message
        ? errParsed.data.error.message
        : "Could not score your assessment";
    const code = errParsed.success ? errParsed.data.error.code : undefined;
    throw new ApiRequestError(message, { status: res.status, code });
  }

  const okParsed = assessmentScoreSuccessResponseSchema.safeParse(raw);
  if (!okParsed.success) {
    throw new ApiRequestError("Unexpected response shape from server", { status: 502 });
  }

  return okParsed.data;
}
