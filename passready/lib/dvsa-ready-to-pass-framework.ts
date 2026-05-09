/**
 * Ready to Pass–style structure: 8 skill groups and 27 skills (public DVSA teaching framework).
 * Prep2Pass is independent. This aligns copy with learner-facing framing, not a DVSA product or score line.
 */

export const OFFICIAL_SKILL_GROUPS = [
  { key: "basics", label: "Basics" },
  { key: "control_and_positioning", label: "Control and positioning" },
  { key: "observation_signalling_planning", label: "Observation, signalling and planning" },
  { key: "junctions_roundabouts_crossings", label: "Junctions, roundabouts and crossings" },
  { key: "manoeuvres", label: "Manoeuvres" },
  { key: "road_types", label: "Road types" },
  { key: "driving_conditions", label: "Driving conditions" },
  { key: "following_routes", label: "Following routes" },
] as const;

export type OfficialGroupKey = (typeof OFFICIAL_SKILL_GROUPS)[number]["key"];

export type OfficialSkillId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27;

export type OfficialSkill = {
  id: OfficialSkillId;
  name: string;
  groupKey: OfficialGroupKey;
};

/** The 27 official skills in framework order (1–27). */
export const OFFICIAL_SKILLS: readonly OfficialSkill[] = [
  { id: 1, name: "Legal responsibilities", groupKey: "basics" },
  { id: 2, name: "Safety checks", groupKey: "basics" },
  { id: 3, name: "Cockpit checks", groupKey: "basics" },
  { id: 4, name: "Security", groupKey: "basics" },
  { id: 5, name: "Controls and instruments", groupKey: "basics" },
  { id: 6, name: "Moving away and stopping", groupKey: "basics" },
  { id: 7, name: "Safe positioning", groupKey: "control_and_positioning" },
  { id: 8, name: "Mirrors – vision and use", groupKey: "observation_signalling_planning" },
  { id: 9, name: "Signals", groupKey: "observation_signalling_planning" },
  { id: 10, name: "Anticipation and planning", groupKey: "observation_signalling_planning" },
  { id: 11, name: "Use of speed", groupKey: "observation_signalling_planning" },
  { id: 12, name: "Other traffic", groupKey: "observation_signalling_planning" },
  { id: 13, name: "Fuel-efficient driving", groupKey: "observation_signalling_planning" },
  { id: 14, name: "Junctions", groupKey: "junctions_roundabouts_crossings" },
  { id: 15, name: "Roundabouts", groupKey: "junctions_roundabouts_crossings" },
  { id: 16, name: "Pedestrian crossings", groupKey: "junctions_roundabouts_crossings" },
  { id: 17, name: "Reversing", groupKey: "manoeuvres" },
  { id: 18, name: "Turning the car around", groupKey: "manoeuvres" },
  { id: 19, name: "Parking", groupKey: "manoeuvres" },
  { id: 20, name: "Emergency stop", groupKey: "manoeuvres" },
  { id: 21, name: "Country roads", groupKey: "road_types" },
  { id: 22, name: "Dual carriageways", groupKey: "road_types" },
  { id: 23, name: "Motorways", groupKey: "road_types" },
  { id: 24, name: "Driving in the dark", groupKey: "driving_conditions" },
  { id: 25, name: "Weather conditions", groupKey: "driving_conditions" },
  { id: 26, name: "Passengers and loads", groupKey: "driving_conditions" },
  { id: 27, name: "Independent driving and using a sat nav", groupKey: "following_routes" },
] as const;

const SKILL_BY_ID = new Map<number, OfficialSkill>(
  OFFICIAL_SKILLS.map((s) => [s.id, s]),
);

const GROUP_LABEL = new Map<string, string>(
  OFFICIAL_SKILL_GROUPS.map((g) => [g.key, g.label]),
);

export function officialSkillById(id: number): OfficialSkill | undefined {
  return SKILL_BY_ID.get(id);
}

export function labelForOfficialGroup(key: OfficialGroupKey): string {
  return GROUP_LABEL.get(key) ?? key;
}

/** Display order for grouped risk output. */
export const OFFICIAL_GROUP_ORDER: readonly OfficialGroupKey[] = [
  "basics",
  "control_and_positioning",
  "observation_signalling_planning",
  "junctions_roundabouts_crossings",
  "manoeuvres",
  "road_types",
  "driving_conditions",
  "following_routes",
];
