export const SITE = {
  name: "Prep2Pass",
  tagline: "TestReady Score for learner drivers.",
  locale: "en-GB",
} as const;

export const PREMIUM_PRICE = "£4.99";

export const WEAK_AREA_OPTIONS = [
  {
    id: "roundabouts",
    label: "Roundabouts",
    description: "Approach speed, lane choice, signalling",
  },
  {
    id: "forwardBayParking",
    label: "Forward bay parking",
    description: "Driving into a bay — positioning, accuracy, and observations",
  },
  {
    id: "reverseBayParking",
    label: "Reverse bay parking",
    description: "Reversing into a bay — control, lines, and all-round awareness",
  },
  {
    id: "pullUpOnRightReverse",
    label: "Pull up on the right and reverse",
    description: "Stopping on the right, reversing two car lengths, rejoining traffic safely",
  },
  {
    id: "parallelParking",
    label: "Parallel parking",
    description: "Parking behind another vehicle — control, positioning, observations",
  },
  {
    id: "mirrors",
    label: "Mirrors & MSPSL",
    description: "Routine mirror checks before change of speed or direction",
  },
  {
    id: "junctions",
    label: "Junctions",
    description: "Emerging, turning, positioning, observations",
  },
  {
    id: "observations",
    label: "Observations",
    description: "Effective looks, blind spots, pedestrian awareness",
  },
  {
    id: "speedControl",
    label: "Speed & limits",
    description: "Appropriate speed for road, weather, and hazards",
  },
  {
    id: "clutchControl",
    label: "Clutch & biting point",
    description: "Smooth pulls away, slow control, hill starts",
  },
  {
    id: "independentDriving",
    label: "Independent driving",
    description: "Following signs or sat-nav with safe decisions",
  },
] as const;

export type WeakAreaId = (typeof WEAK_AREA_OPTIONS)[number]["id"];

/** DVSA-style practical skill groupings + weak-area → group map (see `lib/dvsa-skill-groups.ts`). */
export {
  DVSA_SKILL_GROUPS,
  DVSA_GROUP_SCORE_WEIGHT,
  GROUP_ORDER,
  WEAK_AREA_TO_DVSA_GROUP,
  labelForSkillGroup,
  type DvsaSkillGroupId,
} from "./dvsa-skill-groups";
