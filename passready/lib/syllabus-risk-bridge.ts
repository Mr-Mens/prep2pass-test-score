/**
 * Bridges syllabus checklist gaps into DVSA-style risk group highlights (not weak-area duplicates).
 */

import type { OfficialGroupKey } from "@/lib/dvsa-ready-to-pass-framework";

import type { AssessmentPayload } from "@/lib/validation";
import { syllabusLayerActive } from "@/lib/syllabus-coverage";
import {
  SYLLABUS_TOPIC_CATALOG,
  syllabusTopicLabel,
} from "@/lib/syllabus-topics";
import type { WeakAreaId } from "@/lib/product-skill-map";

/** Syllabus topic ids to treat as "already represented" when a coarse weak-area tick exists. */
const WEAKAREA_SYLLABUS_COVERED: Partial<Record<WeakAreaId, readonly string[]>> = {
  mirrors: ["mirrors_observations", "use_of_mirrors_routine"],
  speedControl: ["speed_awareness"],
  junctions: ["left_turns", "right_turns", "emerging_left", "emerging_right", "crossroads", "t_junctions"],
  roundabouts: ["roundabouts", "mini_roundabouts"],
  movingOffSafely: ["moving_off_safely"],
  lanePositioning: ["lane_discipline"],
  forwardBayParking: ["forward_bay_parking"],
  reverseBayParking: ["reverse_bay_parking"],
  pullUpOnRightReverse: ["pull_up_on_right"],
  parallelParking: ["parallel_parking"],
  independentDriving: ["sat_nav_driving", "following_signs", "planning_ahead", "independent_decision_making"],
  countryRoads: ["country_roads"],
  dualCarriageways: ["dual_carriageways"],
  motorways: [],
  nightDriving: [],
  weatherConditions: [],
};

const TOPIC_GROUP: Partial<Record<string, OfficialGroupKey>> = {};

for (const cat of SYLLABUS_TOPIC_CATALOG) {
  for (const it of cat.items) {
    TOPIC_GROUP[it.id] =
      cat.key === "basic_controls"
        ? it.id.startsWith("steering")
          ? "control_and_positioning"
          : "basics"
        : cat.key === "junctions"
          ? "junctions_roundabouts_crossings"
          : cat.key === "roads_traffic"
            ? it.id === "roundabouts" || it.id === "mini_roundabouts" || it.id === "pedestrian_crossings"
              ? "junctions_roundabouts_crossings"
              : "road_types"
            : cat.key === "manoeuvres"
              ? "manoeuvres"
              : cat.key === "independent_driving"
                ? "following_routes"
                : "observation_signalling_planning";
  }
}

function excludedTopicsFromWeakAreas(weak: readonly WeakAreaId[]): Set<string> {
  const exc = new Set<string>();
  for (const wid of weak) {
    const add = WEAKAREA_SYLLABUS_COVERED[wid];
    if (!add?.length) continue;
    for (const id of add) exc.add(id);
  }
  return exc;
}

/**
 * Highlights per DVSA bucket: practise themes not marked on syllabus checklist (excluding weak-area overlap).
 */
export function syllabusGapHighlightsByRiskGroup(
  assessment: AssessmentPayload,
): Partial<Record<OfficialGroupKey, string>> {
  if (!syllabusLayerActive(assessment)) return {};

  const covered = new Set(assessment.topicsCovered ?? []);
  const weakExc = excludedTopicsFromWeakAreas(assessment.weakAreas as WeakAreaId[]);

  const labelsByGroup = new Map<OfficialGroupKey, string[]>();

  for (const cat of SYLLABUS_TOPIC_CATALOG) {
    for (const it of cat.items) {
      if (covered.has(it.id)) continue;
      if (weakExc.has(it.id)) continue;
      const gk = TOPIC_GROUP[it.id];
      if (!gk) continue;
      const arr = labelsByGroup.get(gk) ?? [];
      if (arr.length >= 8) continue;
      arr.push(syllabusTopicLabel(it.id));
      labelsByGroup.set(gk, arr);
    }
  }

  const out: Partial<Record<OfficialGroupKey, string>> = {};
  for (const [gk, labels] of Array.from(labelsByGroup.entries())) {
    if (labels.length === 0) continue;
    const joined = labels.join(", ");
    out[gk] = `Learning roadmap: you have not ticked ${joined} as practised yet. Plan guided seat time here even if it is not on your weak-area list, so examiner-style routes feel complete.`;
  }
  return out;
}
