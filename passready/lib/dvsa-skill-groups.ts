/**
 * Practical test skill groupings aligned with common DVSA “driving skills” themes.
 * Prep2Pass is independent — this is a structured teaching framework, not a DVSA product.
 */
export const DVSA_SKILL_GROUPS = [
  { id: "basics", label: "Basics" },
  { id: "controlAndPositioning", label: "Control and Positioning" },
  { id: "observationSignallingPlanning", label: "Observation, Signalling and Planning" },
  { id: "junctionsRoundaboutsCrossings", label: "Junctions, Roundabouts and Crossings" },
  { id: "manoeuvres", label: "Manoeuvres" },
  { id: "roadTypes", label: "Road Types" },
  { id: "drivingConditions", label: "Driving Conditions" },
  { id: "independentDriving", label: "Independent Driving" },
] as const;

export type DvsaSkillGroupId = (typeof DVSA_SKILL_GROUPS)[number]["id"];

export function labelForSkillGroup(id: DvsaSkillGroupId): string {
  return DVSA_SKILL_GROUPS.find((g) => g.id === id)?.label ?? id;
}

/** Weak-area ids from the assessment form (kept in sync with `WEAK_AREA_OPTIONS`). */
export type MappedWeakAreaId =
  | "roundabouts"
  | "forwardBayParking"
  | "reverseBayParking"
  | "pullUpOnRightReverse"
  | "parallelParking"
  | "mirrors"
  | "junctions"
  | "observations"
  | "speedControl"
  | "clutchControl"
  | "independentDriving";

/** Maps each selectable weak area to a skill group (for scoring + reporting). */
export const WEAK_AREA_TO_DVSA_GROUP: Record<MappedWeakAreaId, DvsaSkillGroupId> = {
  roundabouts: "junctionsRoundaboutsCrossings",
  forwardBayParking: "manoeuvres",
  reverseBayParking: "manoeuvres",
  pullUpOnRightReverse: "manoeuvres",
  parallelParking: "manoeuvres",
  mirrors: "observationSignallingPlanning",
  junctions: "junctionsRoundaboutsCrossings",
  observations: "observationSignallingPlanning",
  speedControl: "observationSignallingPlanning",
  clutchControl: "controlAndPositioning",
  independentDriving: "independentDriving",
};

/** Higher = stronger impact on readiness score when this group is flagged. */
export const DVSA_GROUP_SCORE_WEIGHT: Record<DvsaSkillGroupId, number> = {
  basics: 1.0,
  controlAndPositioning: 1.12,
  observationSignallingPlanning: 1.32,
  junctionsRoundaboutsCrossings: 1.32,
  manoeuvres: 1.14,
  roadTypes: 1.06,
  drivingConditions: 1.06,
  independentDriving: 1.18,
};

export const GROUP_ORDER: DvsaSkillGroupId[] = [
  "basics",
  "controlAndPositioning",
  "observationSignallingPlanning",
  "junctionsRoundaboutsCrossings",
  "manoeuvres",
  "roadTypes",
  "drivingConditions",
  "independentDriving",
];
