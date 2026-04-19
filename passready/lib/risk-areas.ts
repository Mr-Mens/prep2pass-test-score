import type { GroupedRiskArea } from "./validation";

/** Coerce legacy flat strings or unknown DB JSON into grouped risk areas for UI. */
export function normalizeGroupedRiskAreas(
  raw: string[] | GroupedRiskArea[] | null | undefined,
): GroupedRiskArea[] {
  if (!raw || raw.length === 0) {
    return [
      {
        group: "General",
        severity: "low",
        issues: ["No specific risk lines recorded — still worth a mock route near your test centre."],
      },
    ];
  }
  const first = raw[0];
  if (typeof first === "string") {
    return [
      {
        group: "Your Test Risk Areas (Based on Driving Skills Framework)",
        severity: "medium",
        issues: raw as string[],
      },
    ];
  }
  if (first && typeof first === "object" && "group" in first && "issues" in first) {
    return raw as GroupedRiskArea[];
  }
  return [
    {
      group: "General",
      severity: "low",
      issues: ["Unable to parse stored risk areas."],
    },
  ];
}
