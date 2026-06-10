import type { WeakAreaId } from "@/lib/constants";
import { isManoeuvreWeakArea } from "@/lib/product-skill-map";
import type { AssessmentPayload } from "@/lib/validation";

export const WEAK_AREA_FOLLOW_UP_CATEGORIES = [
  {
    id: "junctions",
    label: "Junctions",
    question: "What do you find difficult at junctions?",
  },
  {
    id: "roundabouts",
    label: "Roundabouts",
    question: "What do you find difficult at roundabouts?",
  },
  {
    id: "manoeuvres",
    label: "Manoeuvres",
    question: "What part of manoeuvres do you find difficult?",
  },
  {
    id: "independentDriving",
    label: "Independent driving",
    question: "What do you find difficult with independent driving?",
  },
  {
    id: "dualCarriageways",
    label: "Dual carriageways",
    question: "What do you find difficult on dual carriageways?",
  },
  {
    id: "confidence",
    label: "Confidence",
    question: "What affects your confidence most?",
  },
] as const;

export type WeakAreaFollowUpCategoryId = (typeof WEAK_AREA_FOLLOW_UP_CATEGORIES)[number]["id"];

export const WEAK_AREA_FOLLOW_UP_SUBTOPICS = [
  { id: "junctions_observations", categoryId: "junctions", label: "Observations" },
  { id: "junctions_judging_gaps", categoryId: "junctions", label: "Judging safe gaps" },
  { id: "junctions_emerging", categoryId: "junctions", label: "Emerging into traffic" },
  { id: "junctions_turning_right", categoryId: "junctions", label: "Turning right" },
  { id: "junctions_turning_left", categoryId: "junctions", label: "Turning left" },
  { id: "junctions_positioning", categoryId: "junctions", label: "Positioning" },
  { id: "junctions_approach_speed", categoryId: "junctions", label: "Approach speed" },
  { id: "junctions_planning_ahead", categoryId: "junctions", label: "Planning ahead" },
  { id: "junctions_confidence", categoryId: "junctions", label: "Confidence" },
  { id: "junctions_not_sure", categoryId: "junctions", label: "Not sure" },

  { id: "roundabouts_lane_choice", categoryId: "roundabouts", label: "Lane choice" },
  { id: "roundabouts_observations", categoryId: "roundabouts", label: "Observations" },
  { id: "roundabouts_positioning", categoryId: "roundabouts", label: "Positioning" },
  { id: "roundabouts_choosing_exits", categoryId: "roundabouts", label: "Choosing exits" },
  { id: "roundabouts_signalling", categoryId: "roundabouts", label: "Signalling" },
  { id: "roundabouts_road_markings", categoryId: "roundabouts", label: "Reading road markings" },
  { id: "roundabouts_multi_lane", categoryId: "roundabouts", label: "Multi-lane roundabouts" },
  { id: "roundabouts_confidence", categoryId: "roundabouts", label: "Confidence" },
  { id: "roundabouts_not_sure", categoryId: "roundabouts", label: "Not sure" },

  { id: "manoeuvres_observations", categoryId: "manoeuvres", label: "Observations" },
  { id: "manoeuvres_steering", categoryId: "manoeuvres", label: "Steering control" },
  { id: "manoeuvres_accuracy", categoryId: "manoeuvres", label: "Accuracy" },
  { id: "manoeuvres_bay_parking", categoryId: "manoeuvres", label: "Bay parking" },
  { id: "manoeuvres_parallel", categoryId: "manoeuvres", label: "Parallel parking" },
  { id: "manoeuvres_pull_up_right", categoryId: "manoeuvres", label: "Pull up on the right" },
  { id: "manoeuvres_positioning", categoryId: "manoeuvres", label: "Vehicle positioning" },
  { id: "manoeuvres_confidence", categoryId: "manoeuvres", label: "Confidence" },
  { id: "manoeuvres_not_sure", categoryId: "manoeuvres", label: "Not sure" },

  { id: "independent_sat_nav", categoryId: "independentDriving", label: "Following sat nav" },
  { id: "independent_signs", categoryId: "independentDriving", label: "Following signs" },
  { id: "independent_planning", categoryId: "independentDriving", label: "Planning ahead" },
  { id: "independent_decisions", categoryId: "independentDriving", label: "Making decisions independently" },
  { id: "independent_reading_traffic", categoryId: "independentDriving", label: "Reading traffic situations" },
  { id: "independent_confidence", categoryId: "independentDriving", label: "Confidence" },
  { id: "independent_not_sure", categoryId: "independentDriving", label: "Not sure" },

  { id: "dual_joining", categoryId: "dualCarriageways", label: "Joining safely" },
  { id: "dual_lane_discipline", categoryId: "dualCarriageways", label: "Lane discipline" },
  { id: "dual_overtaking", categoryId: "dualCarriageways", label: "Overtaking" },
  { id: "dual_mirrors", categoryId: "dualCarriageways", label: "Mirror checks" },
  { id: "dual_speed_judgement", categoryId: "dualCarriageways", label: "Speed judgement" },
  { id: "dual_confidence", categoryId: "dualCarriageways", label: "Confidence" },
  { id: "dual_not_sure", categoryId: "dualCarriageways", label: "Not sure" },

  { id: "confidence_fear_mistakes", categoryId: "confidence", label: "Fear of mistakes" },
  { id: "confidence_busy_roads", categoryId: "confidence", label: "Busy roads" },
  { id: "confidence_roundabouts", categoryId: "confidence", label: "Roundabouts" },
  { id: "confidence_junctions", categoryId: "confidence", label: "Junctions" },
  { id: "confidence_parking", categoryId: "confidence", label: "Parking" },
  { id: "confidence_test_nerves", categoryId: "confidence", label: "Test nerves" },
  { id: "confidence_unfamiliar", categoryId: "confidence", label: "Driving somewhere unfamiliar" },
  { id: "confidence_general", categoryId: "confidence", label: "General confidence" },
] as const;

export type WeakAreaFollowUpSubtopicId = (typeof WEAK_AREA_FOLLOW_UP_SUBTOPICS)[number]["id"];

export const weakAreaFollowUpCategoryIds = WEAK_AREA_FOLLOW_UP_CATEGORIES.map((c) => c.id) as [
  WeakAreaFollowUpCategoryId,
  ...WeakAreaFollowUpCategoryId[],
];

export const weakAreaFollowUpSubtopicIds = WEAK_AREA_FOLLOW_UP_SUBTOPICS.map((s) => s.id) as [
  WeakAreaFollowUpSubtopicId,
  ...WeakAreaFollowUpSubtopicId[],
];

const subtopicById = new Map(WEAK_AREA_FOLLOW_UP_SUBTOPICS.map((s) => [s.id, s]));
const categoryById = new Map(WEAK_AREA_FOLLOW_UP_CATEGORIES.map((c) => [c.id, c]));

export type WeakAreaDetailEntry = {
  category: WeakAreaFollowUpCategoryId;
  subtopics: WeakAreaFollowUpSubtopicId[];
  notes?: string;
};

export function subtopicsForCategory(categoryId: WeakAreaFollowUpCategoryId) {
  return WEAK_AREA_FOLLOW_UP_SUBTOPICS.filter((s) => s.categoryId === categoryId);
}

export function labelForFollowUpSubtopic(id: WeakAreaFollowUpSubtopicId): string {
  return subtopicById.get(id)?.label ?? id;
}

export function questionForFollowUpCategory(id: WeakAreaFollowUpCategoryId): string {
  return categoryById.get(id)?.question ?? "Tell us a bit more";
}

/** Which optional follow-up blocks to show from selected weak areas + confidence. */
export function activeFollowUpCategories(input: {
  weakAreas: WeakAreaId[];
  confidenceLevel: number;
}): WeakAreaFollowUpCategoryId[] {
  const out = new Set<WeakAreaFollowUpCategoryId>();
  const ids = new Set(input.weakAreas);

  if (ids.has("junctions")) out.add("junctions");
  if (ids.has("roundabouts")) out.add("roundabouts");
  if (input.weakAreas.some((id) => isManoeuvreWeakArea(id))) out.add("manoeuvres");
  if (ids.has("independentDriving")) out.add("independentDriving");
  if (ids.has("dualCarriageways")) out.add("dualCarriageways");
  if (input.confidenceLevel <= 5) out.add("confidence");

  return WEAK_AREA_FOLLOW_UP_CATEGORIES.map((c) => c.id).filter((id) => out.has(id));
}

export function pruneWeakAreaDetails(
  details: WeakAreaDetailEntry[],
  activeCategories: WeakAreaFollowUpCategoryId[],
): WeakAreaDetailEntry[] {
  const allowed = new Set(activeCategories);
  return details
    .filter((d) => allowed.has(d.category))
    .map((d) => ({
      ...d,
      subtopics: d.subtopics.filter((id) => subtopicById.get(id)?.categoryId === d.category),
    }))
    .filter((d) => d.subtopics.length > 0 || (d.notes && d.notes.trim().length > 0));
}

export function learnerIdentifiedLabels(details: WeakAreaDetailEntry[] | undefined): string[] {
  if (!details?.length) return [];
  const labels: string[] = [];
  for (const entry of details) {
    for (const id of entry.subtopics) {
      const label = labelForFollowUpSubtopic(id);
      if (label !== "Not sure") labels.push(label);
    }
    if (entry.notes?.trim()) {
      labels.push(entry.notes.trim());
    }
  }
  return Array.from(new Set(labels));
}

export function hasLearnerFollowUpDetail(details: WeakAreaDetailEntry[] | undefined): boolean {
  return Boolean(details?.some((d) => d.subtopics.length > 0 || d.notes?.trim()));
}

export function buildWeakAreaAiContext(assessment: AssessmentPayload) {
  const details = assessment.weakAreaDetails ?? [];
  const active = activeFollowUpCategories({
    weakAreas: assessment.weakAreas,
    confidenceLevel: assessment.confidenceLevel,
  });

  const knownFacts: string[] = [];
  for (const entry of details) {
    const labels = entry.subtopics
      .map((id) => labelForFollowUpSubtopic(id))
      .filter((l) => l !== "Not sure");
    if (labels.length) {
      knownFacts.push(`${questionForFollowUpCategory(entry.category)}: ${labels.join(", ")}`);
    }
    if (entry.notes?.trim()) {
      knownFacts.push(`Learner note (${entry.category}): ${entry.notes.trim()}`);
    }
  }

  const flaggedWithoutDetail = assessment.weakAreas.filter((id) => {
    const cat = weakAreaIdToFollowUpCategory(id);
    if (!cat) return false;
    const entry = details.find((d) => d.category === cat);
    return !entry || (entry.subtopics.length === 0 && !entry.notes?.trim());
  });

  return {
    learnerProvidedDetail: knownFacts.length > 0,
    knownFacts,
    flaggedWithoutFollowUp: flaggedWithoutDetail.map((id) => id),
    activeFollowUpCategories: active,
    rawDetails: details,
  };
}

function weakAreaIdToFollowUpCategory(id: WeakAreaId): WeakAreaFollowUpCategoryId | null {
  if (id === "junctions") return "junctions";
  if (id === "roundabouts") return "roundabouts";
  if (isManoeuvreWeakArea(id)) return "manoeuvres";
  if (id === "independentDriving") return "independentDriving";
  if (id === "dualCarriageways") return "dualCarriageways";
  return null;
}
