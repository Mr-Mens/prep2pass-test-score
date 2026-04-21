import type { OfficialGroupKey } from "./dvsa-ready-to-pass-framework";

/** Product-facing assessment checkbox ids (learner-friendly). */
export const WEAK_AREA_OPTIONS = [
  {
    id: "mirrors",
    label: "Mirrors & MSPSL",
    description: "Routine mirror checks before change of speed or direction",
  },
  {
    id: "speedControl",
    label: "Speed & limits",
    description: "Appropriate speed for road, weather, and hazards",
  },
  {
    id: "junctions",
    label: "Junctions",
    description: "Emerging, turning, positioning, observations",
  },
  {
    id: "roundabouts",
    label: "Roundabouts",
    description: "Approach speed, lane choice, signalling",
  },
  {
    id: "movingOffSafely",
    label: "Moving off safely",
    description: "Observations, biting point, and joining traffic smoothly",
  },
  {
    id: "lanePositioning",
    label: "Lane positioning",
    description: "Road position, lane discipline, and space around hazards",
  },
  {
    id: "forwardBayParking",
    label: "Forward bay parking",
    description: "Driving into a bay: positioning, accuracy, and observations",
  },
  {
    id: "reverseBayParking",
    label: "Reverse bay parking",
    description: "Reversing into a bay: control, lines, and all-round awareness",
  },
  {
    id: "pullUpOnRightReverse",
    label: "Pull up on the right and reverse",
    description: "Stopping on the right, reversing two car lengths, rejoining traffic safely",
  },
  {
    id: "parallelParking",
    label: "Parallel parking",
    description: "Parking behind another vehicle: control, positioning, observations",
  },
  {
    id: "independentDriving",
    label: "Independent driving",
    description: "Following signs or sat-nav with safe decisions",
  },
  {
    id: "countryRoads",
    label: "Country roads",
    description: "Narrow lanes, passing places, farm traffic, and bends",
  },
  {
    id: "dualCarriageways",
    label: "Dual carriageways",
    description: "Slip roads, lane speeds, and safe joining or leaving",
  },
  {
    id: "motorways",
    label: "Motorways",
    description: "Higher speeds, lane discipline, and joining or leaving safely",
  },
  {
    id: "nightDriving",
    label: "Driving in the dark",
    description: "Use of lights, judging speed, and reduced visibility",
  },
  {
    id: "weatherConditions",
    label: "Weather conditions",
    description: "Rain, wind, low grip, and adjusting speed and space",
  },
] as const;

export type WeakAreaId = (typeof WEAK_AREA_OPTIONS)[number]["id"];

export type RiskTier = "critical" | "high" | "medium" | "low";

export type ProductSkillMeta = {
  groupKey: OfficialGroupKey;
  officialSkillId: number;
  riskTier: RiskTier;
  /** Short label for chips / bullets in the report. */
  reportLabel: string;
  /** One deterministic issue line (instructor-style). */
  issueLine: string;
};

export const PRODUCT_SKILL_MAP = {
  mirrors: {
    groupKey: "observation_signalling_planning",
    officialSkillId: 8,
    riskTier: "critical",
    reportLabel: "Mirrors",
    issueLine:
      "Mirrors & MSPSL: mirror routine before signalling, braking, or changing direction. Weak mirror use often drives junction and roundabout faults.",
  },
  speedControl: {
    groupKey: "observation_signalling_planning",
    officialSkillId: 11,
    riskTier: "critical",
    reportLabel: "Speed & limits",
    issueLine:
      "Use of speed: matching limits and conditions with safe judgement. Speed and positioning faults often appear together under test pressure.",
  },
  junctions: {
    groupKey: "junctions_roundabouts_crossings",
    officialSkillId: 14,
    riskTier: "critical",
    reportLabel: "Junctions",
    issueLine:
      "Junctions: emerging and positioning with early observations. Avoid late speed changes that surprise following traffic.",
  },
  roundabouts: {
    groupKey: "junctions_roundabouts_crossings",
    officialSkillId: 15,
    riskTier: "critical",
    reportLabel: "Roundabouts",
    issueLine:
      "Roundabouts: approach speed, lane discipline, and observations under test-style pressure.",
  },
  movingOffSafely: {
    groupKey: "basics",
    officialSkillId: 6,
    riskTier: "critical",
    reportLabel: "Moving off safely",
    issueLine:
      "Moving away and stopping: all-round observations and smooth control on every pull-away. Faults here repeat across routes.",
  },
  lanePositioning: {
    groupKey: "control_and_positioning",
    officialSkillId: 7,
    riskTier: "critical",
    reportLabel: "Lane positioning",
    issueLine:
      "Safe positioning: road position, lane discipline, and safe space around hazards. This pairs with speed judgement on busy roads.",
  },
  forwardBayParking: {
    groupKey: "manoeuvres",
    officialSkillId: 19,
    riskTier: "medium",
    reportLabel: "Forward bay parking",
    issueLine:
      "Forward bay parking: positioning into the bay with accuracy and observations through the move.",
  },
  reverseBayParking: {
    groupKey: "manoeuvres",
    officialSkillId: 19,
    riskTier: "medium",
    reportLabel: "Reverse bay parking",
    issueLine:
      "Reverse bay parking: line control and all-round awareness while reversing into the bay.",
  },
  pullUpOnRightReverse: {
    groupKey: "manoeuvres",
    officialSkillId: 17,
    riskTier: "medium",
    reportLabel: "Pull up on the right and reverse",
    issueLine:
      "Pull up on the right and reverse: safe stop, two-car-length reverse, and rejoining with effective observations.",
  },
  parallelParking: {
    groupKey: "manoeuvres",
    officialSkillId: 19,
    riskTier: "medium",
    reportLabel: "Parallel parking",
    issueLine:
      "Parallel parking: clearance, slow-speed control, and observations while positioning next to the kerb.",
  },
  independentDriving: {
    groupKey: "following_routes",
    officialSkillId: 27,
    riskTier: "high",
    reportLabel: "Independent driving",
    issueLine:
      "Independent driving and sat-nav: lane discipline and planning when following signs or directions for several minutes.",
  },
  countryRoads: {
    groupKey: "road_types",
    officialSkillId: 21,
    riskTier: "medium",
    reportLabel: "Country roads",
    issueLine:
      "Country roads: meeting traffic, bends, and limited sight lines with calm speed and position.",
  },
  dualCarriageways: {
    groupKey: "road_types",
    officialSkillId: 22,
    riskTier: "medium",
    reportLabel: "Dual carriageways",
    issueLine:
      "Dual carriageways: slip-road judgement, safe joining speed, and lane discipline at higher speeds.",
  },
  motorways: {
    groupKey: "road_types",
    officialSkillId: 23,
    riskTier: "medium",
    reportLabel: "Motorways",
    issueLine:
      "Motorways: joining, lane discipline, and safe gaps. Even if not on every test route, gaps here show planning under speed.",
  },
  nightDriving: {
    groupKey: "driving_conditions",
    officialSkillId: 24,
    riskTier: "low",
    reportLabel: "Driving in the dark",
    issueLine:
      "Driving in the dark: correct use of lights and judging speed when visibility is reduced.",
  },
  weatherConditions: {
    groupKey: "driving_conditions",
    officialSkillId: 25,
    riskTier: "medium",
    reportLabel: "Weather conditions",
    issueLine:
      "Weather conditions: grip, braking distance, and space in rain or other reduced-traction conditions.",
  },
} as const satisfies Record<WeakAreaId, ProductSkillMeta>;

/** Penalty units per flagged product skill (deterministic; tune here). */
export const RISK_TIER_POINTS: Record<RiskTier, number> = {
  critical: 5.1,
  high: 3.7,
  medium: 2.6,
  low: 1.5,
};

/** Common fail-pattern pairs: extra penalty when both are selected. */
export const WEAK_AREA_CLUSTERS: readonly { a: WeakAreaId; b: WeakAreaId; penalty: number }[] = [
  { a: "mirrors", b: "junctions", penalty: 2.7 },
  { a: "junctions", b: "roundabouts", penalty: 2.5 },
  { a: "speedControl", b: "lanePositioning", penalty: 2.3 },
  { a: "movingOffSafely", b: "mirrors", penalty: 2.3 },
  { a: "reverseBayParking", b: "parallelParking", penalty: 1.9 },
  { a: "pullUpOnRightReverse", b: "movingOffSafely", penalty: 1.9 },
];

export function productMeta(id: WeakAreaId): ProductSkillMeta {
  return PRODUCT_SKILL_MAP[id];
}

export const MANOEUVRE_WEAK_AREA_IDS = [
  "forwardBayParking",
  "reverseBayParking",
  "pullUpOnRightReverse",
  "parallelParking",
] as const satisfies readonly WeakAreaId[];

export type ManoeuvreWeakAreaId = (typeof MANOEUVRE_WEAK_AREA_IDS)[number];

export function isManoeuvreWeakArea(id: WeakAreaId): id is ManoeuvreWeakAreaId {
  return (MANOEUVRE_WEAK_AREA_IDS as readonly string[]).includes(id);
}
