import { ApiRequestError } from "@/lib/errors";
import {
  finaliseReportErrorSchema,
  finaliseReportSuccessSchema,
  type AssessmentPayload,
  type FinaliseReportSuccess,
} from "@/lib/validation";

export async function requestFinaliseReport(
  sessionId: string,
  assessment: AssessmentPayload,
): Promise<FinaliseReportSuccess> {
  const res = await fetch("/api/reports/finalise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, assessment }),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from report finalisation service", {
      status: res.status,
    });
  }

  if (!res.ok) {
    const err = finaliseReportErrorSchema.safeParse(raw);
    throw new ApiRequestError(
      err.success ? err.data.error.message : "Could not finalise report",
      { status: res.status, code: err.success ? err.data.error.code : undefined },
    );
  }

  const ok = finaliseReportSuccessSchema.safeParse(raw);
  if (!ok.success) {
    throw new ApiRequestError("Unexpected finalise response shape", { status: 502 });
  }

  return ok.data;
}
