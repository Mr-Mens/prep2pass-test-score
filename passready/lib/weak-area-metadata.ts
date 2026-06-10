import type { AssessmentPayload, ReportMetadata, WeakAreaDetailEntry } from "@/lib/validation";
import { weakAreaDetailEntrySchema } from "@/lib/validation";

/** Attach learner weak-area follow-up to report metadata (works before DB column migration). */
export function weakAreaDetailsForMetadata(assessment: AssessmentPayload): Pick<ReportMetadata, "weakAreaDetails"> {
  const details = assessment.weakAreaDetails ?? [];
  return details.length > 0 ? { weakAreaDetails: details } : {};
}

export function weakAreaDetailsFromRawMetadata(raw: unknown): WeakAreaDetailEntry[] {
  if (!raw || typeof raw !== "object") return [];
  const details = "weakAreaDetails" in raw ? (raw as { weakAreaDetails: unknown }).weakAreaDetails : undefined;
  if (!Array.isArray(details)) return [];
  const out: WeakAreaDetailEntry[] = [];
  for (const item of details) {
    const parsed = weakAreaDetailEntrySchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}
