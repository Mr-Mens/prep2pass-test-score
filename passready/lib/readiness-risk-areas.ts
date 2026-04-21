import { z } from "zod";

import { labelForOfficialGroup, type OfficialGroupKey } from "./dvsa-ready-to-pass-framework";

export const riskSeveritySchema = z.enum(["high", "moderate", "low"]);
export type RiskSeverity = z.infer<typeof riskSeveritySchema>;

export const riskAreaSkillSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  officialSkillId: z.number().int().min(1).max(27),
  officialSkillName: z.string().min(1),
});
export type RiskAreaSkill = z.infer<typeof riskAreaSkillSchema>;

export const groupedRiskAreaSchema = z.object({
  groupKey: z.string().min(1),
  groupLabel: z.string().min(1),
  severity: riskSeveritySchema,
  skills: z.array(riskAreaSkillSchema).max(14),
  summary: z.string().min(1).max(900),
  highlights: z.array(z.string().min(1)).max(8).optional(),
  legacyIssues: z.array(z.string()).optional(),
});
export type GroupedRiskArea = z.infer<typeof groupedRiskAreaSchema>;

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  high: 0,
  moderate: 1,
  low: 2,
};

/** Legacy API / model output used "medium"; map to "moderate" for display and schema. */
export function coerceRiskSeverity(raw: string): RiskSeverity {
  if (raw === "high" || raw === "moderate" || raw === "low") return raw;
  if (raw === "medium") return "moderate";
  return "low";
}

/**
 * Highest severity first, then more affected skills, then highlights/legacy bullets, then stable group key.
 */
export function sortGroupedRiskAreasByImpact(blocks: GroupedRiskArea[]): GroupedRiskArea[] {
  return Array.from(blocks).sort((a, b) => {
    const ra = SEVERITY_RANK[a.severity] ?? 9;
    const rb = SEVERITY_RANK[b.severity] ?? 9;
    if (ra !== rb) return ra - rb;
    const weight = (g: GroupedRiskArea) =>
      g.skills.length + (g.highlights?.length ?? 0) + (g.legacyIssues?.length ?? 0);
    const wa = weight(a);
    const wb = weight(b);
    if (wb !== wa) return wb - wa;
    return a.groupKey.localeCompare(b.groupKey);
  });
}

function coerceBlocks(blocks: GroupedRiskArea[]): GroupedRiskArea[] {
  return blocks.map((b) => ({
    ...b,
    severity: coerceRiskSeverity(b.severity as string),
  }));
}

/** Legacy report titles from older Prep2Pass builds → official group keys. */
const LEGACY_GROUP_TITLE_TO_KEY: Record<string, OfficialGroupKey> = {
  Basics: "basics",
  "Control and Positioning": "control_and_positioning",
  "Observation, Signalling and Planning": "observation_signalling_planning",
  "Observation, signalling and planning": "observation_signalling_planning",
  "Junctions, Roundabouts and Crossings": "junctions_roundabouts_crossings",
  "Junctions, roundabouts and crossings": "junctions_roundabouts_crossings",
  Manoeuvres: "manoeuvres",
  "Road Types": "road_types",
  "Road types": "road_types",
  "Driving Conditions": "driving_conditions",
  "Driving conditions": "driving_conditions",
  "Independent Driving": "following_routes",
  "Following routes": "following_routes",
  "Your Test Risk Areas (Based on Driving Skills Framework)": "basics",
  General: "basics",
};

function legacyTitleToKey(title: string): OfficialGroupKey {
  const k = LEGACY_GROUP_TITLE_TO_KEY[title];
  if (k) return k;
  const hit = Object.entries(LEGACY_GROUP_TITLE_TO_KEY).find(([a]) => a.toLowerCase() === title.toLowerCase());
  return (hit?.[1] as OfficialGroupKey | undefined) ?? "basics";
}

function isV2Block(x: unknown): x is GroupedRiskArea {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  const sev = o.severity;
  return (
    typeof o.groupKey === "string" &&
    typeof o.groupLabel === "string" &&
    typeof o.summary === "string" &&
    (sev === "high" || sev === "moderate" || sev === "low" || sev === "medium") &&
    Array.isArray(o.skills)
  );
}

function isLegacyBlock(x: unknown): x is { group: string; severity: string; issues: string[] } {
  return (
    typeof x === "object" &&
    x !== null &&
    "group" in x &&
    "issues" in x &&
    "severity" in x &&
    Array.isArray((x as { issues: unknown }).issues)
  );
}

/**
 * Coerce legacy flat strings, legacy { group, issues }, or unknown DB JSON into grouped risk areas.
 */
export function normalizeGroupedRiskAreas(raw: unknown): GroupedRiskArea[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return sortGroupedRiskAreasByImpact([
      {
        groupKey: "basics",
        groupLabel: labelForOfficialGroup("basics"),
        severity: "low",
        skills: [],
        summary:
          "No stored risk lines for this snapshot. Run a mock route near your test centre to stress-test your usual routines.",
      },
    ]);
  }

  const first = raw[0];
  if (typeof first === "string") {
    const lines = raw as string[];
    return sortGroupedRiskAreasByImpact([
      {
        groupKey: "basics",
        groupLabel: labelForOfficialGroup("basics"),
        severity: "moderate",
        skills: [],
        summary: lines.slice(0, 2).join(" "),
        legacyIssues: lines,
      },
    ]);
  }

  if (isV2Block(first)) {
    return sortGroupedRiskAreasByImpact(coerceBlocks(raw as GroupedRiskArea[]));
  }

  if (isLegacyBlock(first)) {
    const mapped = (raw as { group: string; severity: string; issues: string[] }[]).map((block) => {
      const groupKey = legacyTitleToKey(block.group);
      return {
        groupKey,
        groupLabel: labelForOfficialGroup(groupKey),
        severity: coerceRiskSeverity(block.severity),
        skills: [],
        summary: block.issues.slice(0, 2).join(" "),
        legacyIssues: block.issues,
      };
    });
    return sortGroupedRiskAreasByImpact(mapped);
  }

  return sortGroupedRiskAreasByImpact([
    {
      groupKey: "basics",
      groupLabel: labelForOfficialGroup("basics"),
      severity: "low",
      skills: [],
      summary:
        "Stored risk areas could not be read. Your instructor can still review on-road performance with you.",
    },
  ]);
}
