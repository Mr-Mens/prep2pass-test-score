/** Learner syllabus topics (UK practical prep). Stable IDs for persistence + future instructor sync. */

export type SyllabusCategoryKey =
  | "basic_controls"
  | "junctions"
  | "roads_traffic"
  | "manoeuvres"
  | "independent_driving"
  | "safety_awareness";

export type SyllabusTopicItem = {
  id: string;
  label: string;
  /** Contribution to weighted coverage (1 baseline, higher = hurts more when missing). */
  weight: number;
};

export type SyllabusCategoryDefinition = {
  key: SyllabusCategoryKey;
  title: string;
  description: string;
  items: readonly SyllabusTopicItem[];
};

export const SYLLABUS_TOPIC_CATALOG: readonly SyllabusCategoryDefinition[] = [
  {
    key: "basic_controls",
    title: "Basic controls",
    description: "Cockpit fundamentals and smooth control routines.",
    items: [
      { id: "cockpit_drill", label: "Cockpit drill", weight: 1.25 },
      { id: "moving_off_safely", label: "Moving off safely", weight: 1.6 },
      { id: "stopping_safely", label: "Stopping safely", weight: 1.5 },
      { id: "clutch_control", label: "Clutch control", weight: 1.5 },
      { id: "steering_control", label: "Steering control", weight: 1.35 },
      { id: "gear_changes", label: "Gear changes", weight: 1.45 },
      { id: "mirrors_observations", label: "Mirrors and observations", weight: 1.7 },
    ],
  },
  {
    key: "junctions",
    title: "Junctions",
    description: "Approaching, positioning, and emerging with good observation routines.",
    items: [
      { id: "left_turns", label: "Left turns", weight: 1.8 },
      { id: "right_turns", label: "Right turns", weight: 1.8 },
      { id: "emerging_left", label: "Emerging left", weight: 1.95 },
      { id: "emerging_right", label: "Emerging right", weight: 2 },
      { id: "crossroads", label: "Crossroads", weight: 1.85 },
      { id: "t_junctions", label: "T-junctions", weight: 1.85 },
    ],
  },
  {
    key: "roads_traffic",
    title: "Roads & traffic",
    description: "Busier layouts, lanes, crossings, and meeting others.",
    items: [
      { id: "roundabouts", label: "Roundabouts", weight: 2.35 },
      { id: "mini_roundabouts", label: "Mini roundabouts", weight: 2 },
      { id: "dual_carriageways", label: "Dual carriageways", weight: 2.4 },
      { id: "country_roads", label: "Country roads", weight: 1.75 },
      { id: "one_way_systems", label: "One-way systems", weight: 1.65 },
      { id: "meeting_traffic", label: "Meeting traffic", weight: 1.9 },
      { id: "lane_discipline", label: "Lane discipline", weight: 1.85 },
      { id: "pedestrian_crossings", label: "Pedestrian crossings", weight: 1.8 },
    ],
  },
  {
    key: "manoeuvres",
    title: "Manoeuvres",
    description: "Slow-speed car control routines instructors routinely rehearse.",
    items: [
      { id: "parallel_parking", label: "Parallel parking", weight: 2 },
      { id: "forward_bay_parking", label: "Forward bay parking", weight: 1.85 },
      { id: "reverse_bay_parking", label: "Reverse bay parking", weight: 2 },
      { id: "pull_up_on_right", label: "Pull up on the right", weight: 1.95 },
      { id: "emergency_stop", label: "Emergency stop", weight: 1.75 },
    ],
  },
  {
    key: "independent_driving",
    title: "Independent driving",
    description: "Following signs or sat nav without constant prompting.",
    items: [
      { id: "sat_nav_driving", label: "Sat nav driving", weight: 2.2 },
      { id: "following_signs", label: "Following road signs", weight: 2.15 },
      { id: "planning_ahead", label: "Planning ahead", weight: 2.1 },
      { id: "independent_decision_making", label: "Independent decision making", weight: 2.35 },
    ],
  },
  {
    key: "safety_awareness",
    title: "Safety & awareness",
    description: "Habit-level vision, speed choice, and looking out for others.",
    items: [
      { id: "speed_awareness", label: "Speed awareness", weight: 2.05 },
      { id: "hazard_awareness", label: "Hazard awareness", weight: 2.1 },
      { id: "anticipation_planning", label: "Anticipation and planning", weight: 2.05 },
      { id: "use_of_mirrors_routine", label: "Use of mirrors on the move", weight: 1.95 },
      { id: "vulnerable_road_users", label: "Awareness of vulnerable road users", weight: 2.1 },
    ],
  },
] as const;

const UNIQUE_IDS_ORDERED = Array.from(
  new Set(SYLLABUS_TOPIC_CATALOG.flatMap((c) => c.items.map((i) => i.id))),
);

export const SYLLABUS_TOPIC_IDS = UNIQUE_IDS_ORDERED as [string, ...string[]];

export const SYLLABUS_TOPIC_ID_SET = new Set<string>(SYLLABUS_TOPIC_IDS);

export type SyllabusTopicId = (typeof SYLLABUS_TOPIC_IDS)[number];

/** Prioritised for “what to teach next” suggestions when uncovered. */
const URGENCY_IDS: readonly string[] = [
  "roundabouts",
  "dual_carriageways",
  "reverse_bay_parking",
  "parallel_parking",
  "sat_nav_driving",
  "following_signs",
  "independent_decision_making",
  "meeting_traffic",
  "emerging_right",
  "pedestrian_crossings",
];

const topicById = new Map<string, SyllabusTopicItem>();
for (const cat of SYLLABUS_TOPIC_CATALOG) {
  for (const it of cat.items) topicById.set(it.id, it);
}

export const SYLLABUS_TOTAL_TOPIC_COUNT = SYLLABUS_TOPIC_IDS.length;

export function syllabusTopicWeight(id: string): number {
  return topicById.get(id)?.weight ?? 1;
}

export function syllabusTopicLabel(id: string): string {
  return topicById.get(id)?.label ?? id.replace(/_/g, " ");
}

export function syllabusUrgencyScore(id: string): number {
  const idx = URGENCY_IDS.indexOf(id);
  return idx >= 0 ? URGENCY_IDS.length - idx : 0;
}
