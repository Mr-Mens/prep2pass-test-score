import {
  MOCK_REFLECTION_CATEGORIES,
  MOCK_REFLECTION_SUB_OPTIONS,
  type MockReflectionCategoryId,
  type MockReflectionSubOptionId,
} from "./mock-reflection";
import type { AssessmentPayload } from "./validation";

type ReflectionCategorySignal = {
  categoryId: MockReflectionCategoryId;
  groupedReportArea: string;
  officialSkillAreas: string[];
  reportEmphasis: string[];
  coachNoteHints: string[];
  nextStepHints: string[];
};

type ReflectionSubOptionSignal = ReflectionCategorySignal & {
  subOptionId: MockReflectionSubOptionId;
};

export type MockTestReflectionSignals = {
  reinforcedGroups: string[];
  categorySignals: Array<{
    categoryId: MockReflectionCategoryId;
    subOptionId?: MockReflectionSubOptionId;
    groupedReportArea: string;
    officialSkillAreas: string[];
    reportEmphasis: string[];
    coachNoteHints: string[];
    nextStepHints: string[];
  }>;
  coachToneHints: string[];
  nextStepHints: string[];
  extractedKeywords: string[];
};

const categorySignalMap: Record<MockReflectionCategoryId, ReflectionCategorySignal> = {
  mirrors_observations: {
    categoryId: "mirrors_observations",
    groupedReportArea: "Observation, signalling and planning",
    officialSkillAreas: ["Effective use of mirrors", "Awareness and planning"],
    reportEmphasis: ["observation discipline", "timing"],
    coachNoteHints: ["Rebuild mirror routine until checks happen before speed or direction changes."],
    nextStepHints: ["Use MSPSL aloud on every pull away, lane change, and turn."],
  },
  junctions: {
    categoryId: "junctions",
    groupedReportArea: "Junctions, roundabouts and crossings",
    officialSkillAreas: ["Junction approach and turn judgement", "Observation at junctions"],
    reportEmphasis: ["observation", "decision timing"],
    coachNoteHints: ["Slow planning cycle at junction entry and commit only once observations are complete."],
    nextStepHints: ["Slow the approach and re-check before turning."],
  },
  roundabouts: {
    categoryId: "roundabouts",
    groupedReportArea: "Junctions, roundabouts and crossings",
    officialSkillAreas: ["Roundabout lane discipline", "Roundabout observations"],
    reportEmphasis: ["lane choice", "exit timing"],
    coachNoteHints: ["Break roundabouts into entry speed, lane discipline, and exit checks."],
    nextStepHints: ["Practice roundabout routines at lower pace before adding traffic pressure."],
  },
  manoeuvres: {
    categoryId: "manoeuvres",
    groupedReportArea: "Manoeuvres",
    officialSkillAreas: ["Reverse control", "All-round observation"],
    reportEmphasis: ["control", "positioning"],
    coachNoteHints: ["Keep manoeuvre routines slow and verbal to prevent rushed corrections."],
    nextStepHints: ["Repeat reverse setup and finishing position with full observation checks."],
  },
  speed_control: {
    categoryId: "speed_control",
    groupedReportArea: "Control and positioning",
    officialSkillAreas: ["Appropriate speed", "Vehicle control"],
    reportEmphasis: ["speed judgement", "smooth control"],
    coachNoteHints: ["Stabilise speed choices earlier to reduce late braking and steering corrections."],
    nextStepHints: ["Use fixed reference points for speed checks before hazard zones."],
  },
  signals: {
    categoryId: "signals",
    groupedReportArea: "Observation, signalling and planning",
    officialSkillAreas: ["Signal timing and clarity", "Communication to others"],
    reportEmphasis: ["signal timing", "clarity"],
    coachNoteHints: ["Signals should support decisions, not replace observation."],
    nextStepHints: ["Delay signal until decision point so message is clear and relevant."],
  },
  awareness_planning: {
    categoryId: "awareness_planning",
    groupedReportArea: "Following routes and driving independently",
    officialSkillAreas: ["Awareness and planning", "Independent route decisions"],
    reportEmphasis: ["forward planning", "hazard anticipation"],
    coachNoteHints: ["Plan two to three car lengths ahead to reduce reactive decisions."],
    nextStepHints: ["Call out hazards early and decide response before reaching them."],
  },
  positioning: {
    categoryId: "positioning",
    groupedReportArea: "Control and positioning",
    officialSkillAreas: ["Road position", "Lane discipline"],
    reportEmphasis: ["lane position", "consistency"],
    coachNoteHints: ["Prioritise stable lane position before increasing speed on busy roads."],
    nextStepHints: ["Use lane-centre reference points to hold position through bends and turns."],
  },
  other_road_users: {
    categoryId: "other_road_users",
    groupedReportArea: "Driving conditions and shared roads",
    officialSkillAreas: ["Awareness of vulnerable road users", "Safe spacing and priority"],
    reportEmphasis: ["risk awareness", "priority judgement"],
    coachNoteHints: ["Increase margin and scanning when pedestrians or cyclists are nearby."],
    nextStepHints: ["Rehearse safe spacing and early speed reduction around vulnerable users."],
  },
};

const subOptionSignalMap: Record<MockReflectionSubOptionId, ReflectionSubOptionSignal> = {
  mirrors_missed_checks: {
    ...categorySignalMap.mirrors_observations,
    subOptionId: "mirrors_missed_checks",
    reportEmphasis: ["observation consistency"],
    nextStepHints: ["Add a mirror trigger before every speed or lane change."],
    coachNoteHints: ["Missed checks suggest routine gaps rather than isolated slips."],
  },
  mirrors_late_checks: {
    ...categorySignalMap.mirrors_observations,
    subOptionId: "mirrors_late_checks",
    reportEmphasis: ["timing of checks"],
    nextStepHints: ["Check mirrors earlier to create decision time before manoeuvres."],
    coachNoteHints: ["Late mirror checks compress decision time and raise risk under pressure."],
  },
  mirrors_no_final_check: {
    ...categorySignalMap.mirrors_observations,
    subOptionId: "mirrors_no_final_check",
    reportEmphasis: ["blind spot discipline"],
    nextStepHints: ["Add a final blind spot check before moving laterally."],
    coachNoteHints: ["Final check is a safety gate, not an optional step."],
  },
  junctions_poor_observation: {
    ...categorySignalMap.junctions,
    subOptionId: "junctions_poor_observation",
    reportEmphasis: ["observation"],
    nextStepHints: ["Slow the approach and re-check before turning."],
    coachNoteHints: ["Observation quality at junctions is a top pass/fail differentiator."],
  },
  junctions_turn_timing: {
    ...categorySignalMap.junctions,
    subOptionId: "junctions_turn_timing",
    reportEmphasis: ["turn timing"],
    nextStepHints: ["Use a fixed pause before steering input at each turn."],
    coachNoteHints: ["Turn timing improves when speed and observation are stabilised first."],
  },
  junctions_hesitated: {
    ...categorySignalMap.junctions,
    subOptionId: "junctions_hesitated",
    reportEmphasis: ["decision confidence"],
    nextStepHints: ["Practice gap judgement with instructor prompts, then reduce prompts."],
    coachNoteHints: ["Hesitation often reflects uncertainty in early hazard scanning."],
  },
  junctions_approach_too_fast: {
    ...categorySignalMap.junctions,
    subOptionId: "junctions_approach_too_fast",
    officialSkillAreas: ["Appropriate speed on approach", "Junction judgement and timing"],
    reportEmphasis: ["speed_control", "decision_timing"],
    nextStepHints: ["Ease off earlier and set a calmer junction approach speed before final checks."],
    coachNoteHints: ["Approach pace is too high at decision points, cue earlier speed reduction for cleaner choices."],
  },
  junctions_approach_too_slow_hesitant: {
    ...categorySignalMap.junctions,
    subOptionId: "junctions_approach_too_slow_hesitant",
    officialSkillAreas: ["Appropriate speed on approach", "Junction judgement and timing"],
    reportEmphasis: ["speed_control", "decision_timing"],
    nextStepHints: ["Set a steady approach pace and commit once your checks confirm the gap."],
    coachNoteHints: ["Over-cautious approach speed suggests delayed decisions, build confidence with repeat junction reps."],
  },
  roundabouts_lane_choice: {
    ...categorySignalMap.roundabouts,
    subOptionId: "roundabouts_lane_choice",
    reportEmphasis: ["lane discipline"],
    nextStepHints: ["Pre-plan lane choice before entering roundabouts."],
    coachNoteHints: ["Lane choices should be locked before entry, not corrected mid-roundabout."],
  },
  roundabouts_observation_timing: {
    ...categorySignalMap.roundabouts,
    subOptionId: "roundabouts_observation_timing",
    reportEmphasis: ["observation timing"],
    nextStepHints: ["Check mirrors and right-side flow earlier on approach."],
    coachNoteHints: ["Late observations increase rushed decisions at busy entries."],
  },
  roundabouts_exit_signal: {
    ...categorySignalMap.roundabouts,
    subOptionId: "roundabouts_exit_signal",
    reportEmphasis: ["exit communication"],
    nextStepHints: ["Set signal timing at exit count points during practice."],
    coachNoteHints: ["Clear exit signals support safer spacing with following traffic."],
  },
  manoeuvres_lost_control: {
    ...categorySignalMap.manoeuvres,
    subOptionId: "manoeuvres_lost_control",
    reportEmphasis: ["low-speed control"],
    nextStepHints: ["Use slower clutch and brake modulation during reverse drills."],
    coachNoteHints: ["Control slips in manoeuvres improve with lower speed and verbal routines."],
  },
  manoeuvres_poor_observation: {
    ...categorySignalMap.manoeuvres,
    subOptionId: "manoeuvres_poor_observation",
    reportEmphasis: ["all-round checks"],
    nextStepHints: ["Pause and complete all-round checks at each manoeuvre stage."],
    coachNoteHints: ["Observation around manoeuvres should reset before each direction change."],
  },
  manoeuvres_positioning: {
    ...categorySignalMap.manoeuvres,
    subOptionId: "manoeuvres_positioning",
    reportEmphasis: ["finishing position"],
    nextStepHints: ["Repeat reverse setup and finishing position with fixed references."],
    coachNoteHints: ["Final position errors usually come from setup drift at the start."],
  },
  speed_control_too_fast: {
    ...categorySignalMap.speed_control,
    subOptionId: "speed_control_too_fast",
    reportEmphasis: ["hazard speed adaptation"],
    nextStepHints: ["Reduce speed earlier before junctions and narrowing roads."],
    coachNoteHints: ["Early speed reduction creates better observation quality."],
  },
  speed_control_too_slow: {
    ...categorySignalMap.speed_control,
    subOptionId: "speed_control_too_slow",
    reportEmphasis: ["confident progress"],
    nextStepHints: ["Use progressive acceleration on clear roads to match flow safely."],
    coachNoteHints: ["Overly low speed can signal uncertainty and disrupt traffic rhythm."],
  },
  speed_control_gear_brake: {
    ...categorySignalMap.speed_control,
    subOptionId: "speed_control_gear_brake",
    reportEmphasis: ["vehicle control smoothness"],
    nextStepHints: ["Practice brake-pressure control and timely gear selection on familiar routes."],
    coachNoteHints: ["Smooth control usually improves once planning decisions happen earlier."],
  },
  signals_missed: {
    ...categorySignalMap.signals,
    subOptionId: "signals_missed",
    reportEmphasis: ["signal consistency"],
    nextStepHints: ["Use a verbal signal prompt at each turn or lane change."],
    coachNoteHints: ["Missed signals often come from overloaded attention in approach phases."],
  },
  signals_timing: {
    ...categorySignalMap.signals,
    subOptionId: "signals_timing",
    reportEmphasis: ["signal timing"],
    nextStepHints: ["Delay signal until decision point to avoid mixed messages."],
    coachNoteHints: ["Signal timing should align with committed intention."],
  },
  signals_confusing: {
    ...categorySignalMap.signals,
    subOptionId: "signals_confusing",
    reportEmphasis: ["communication clarity"],
    nextStepHints: ["Cancel and reapply signals cleanly when plans change."],
    coachNoteHints: ["Confusing signals are reduced by tighter decision-to-signal sequencing."],
  },
  awareness_planning_late_decisions: {
    ...categorySignalMap.awareness_planning,
    subOptionId: "awareness_planning_late_decisions",
    reportEmphasis: ["planning horizon"],
    nextStepHints: ["Narrate intended actions 5 to 8 seconds earlier."],
    coachNoteHints: ["Late decisions usually indicate short planning horizon under pressure."],
  },
  awareness_planning_hazards: {
    ...categorySignalMap.awareness_planning,
    subOptionId: "awareness_planning_hazards",
    reportEmphasis: ["hazard scanning"],
    nextStepHints: ["Scan side roads and pedestrian zones before committed speed changes."],
    coachNoteHints: ["Hazard misses drop with structured scan rhythm."],
  },
  awareness_planning_reacting_not_planning: {
    ...categorySignalMap.awareness_planning,
    subOptionId: "awareness_planning_reacting_not_planning",
    reportEmphasis: ["proactive driving"],
    nextStepHints: ["Set a repeating scan routine: mirrors, road, side risk, plan."],
    coachNoteHints: ["Reactive driving can be coached into proactive habits with verbal planning."],
  },
  positioning_lane_discipline: {
    ...categorySignalMap.positioning,
    subOptionId: "positioning_lane_discipline",
    reportEmphasis: ["lane consistency"],
    nextStepHints: ["Use lane-centre references on each straight and bend."],
    coachNoteHints: ["Lane drift often rises when speed and observation get out of sync."],
  },
  positioning_road_position: {
    ...categorySignalMap.positioning,
    subOptionId: "positioning_road_position",
    reportEmphasis: ["road position choices"],
    nextStepHints: ["Set road position earlier on approach to turns and hazards."],
    coachNoteHints: ["Road position should be prepared, not corrected at the last moment."],
  },
  positioning_cornering_line: {
    ...categorySignalMap.positioning,
    subOptionId: "positioning_cornering_line",
    reportEmphasis: ["cornering discipline"],
    nextStepHints: ["Practice entry speed and steering line with fixed corner routines."],
    coachNoteHints: ["Safer corner lines come from earlier speed and lane preparation."],
  },
  other_road_users_space: {
    ...categorySignalMap.other_road_users,
    subOptionId: "other_road_users_space",
    reportEmphasis: ["safe margins"],
    nextStepHints: ["Increase following and passing distance in mixed traffic."],
    coachNoteHints: ["Space management is key when confidence or traffic complexity dips."],
  },
  other_road_users_priority: {
    ...categorySignalMap.other_road_users,
    subOptionId: "other_road_users_priority",
    reportEmphasis: ["priority judgement"],
    nextStepHints: ["Rehearse priority calls aloud at complex junctions."],
    coachNoteHints: ["Priority errors reduce when observation and planning are sequenced earlier."],
  },
  other_road_users_pedestrians_cyclists: {
    ...categorySignalMap.other_road_users,
    subOptionId: "other_road_users_pedestrians_cyclists",
    reportEmphasis: ["vulnerable road user awareness"],
    nextStepHints: ["Build earlier scans around crossings, cycle lanes, and parked vehicles."],
    coachNoteHints: ["Earlier recognition of vulnerable users supports smoother, safer decisions."],
  },
};

const keywordRules: Array<{
  keyword: string;
  categoryId?: MockReflectionCategoryId;
  coachToneHint?: string;
  nextStepHint?: string;
}> = [
  { keyword: "mirror", categoryId: "mirrors_observations" },
  { keyword: "observation", categoryId: "mirrors_observations" },
  { keyword: "junction", categoryId: "junctions" },
  { keyword: "roundabout", categoryId: "roundabouts" },
  { keyword: "parking", categoryId: "manoeuvres" },
  { keyword: "reverse", categoryId: "manoeuvres" },
  { keyword: "parallel", categoryId: "manoeuvres" },
  { keyword: "bay", categoryId: "manoeuvres" },
  { keyword: "speed", categoryId: "speed_control" },
  { keyword: "signal", categoryId: "signals" },
  { keyword: "plan", categoryId: "awareness_planning" },
  { keyword: "position", categoryId: "positioning" },
  { keyword: "cyclist", categoryId: "other_road_users" },
  { keyword: "pedestrian", categoryId: "other_road_users" },
  {
    keyword: "panic",
    coachToneHint: "Use calm, confidence-building coach tone; learner reports panic moments.",
    nextStepHint: "Use short breathing reset before complex junctions or roundabouts.",
  },
  {
    keyword: "rush",
    coachToneHint: "Emphasise slowing routines down before manoeuvres and turns.",
    nextStepHint: "Insert a deliberate pause before turning or changing direction.",
  },
  {
    keyword: "hesitat",
    coachToneHint: "Reassure decision confidence while reinforcing early observation habits.",
    nextStepHint: "Rehearse gap judgement with repeated low-pressure junction drills.",
  },
];

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function hasSubOption(
  signal: ReflectionCategorySignal | ReflectionSubOptionSignal,
): signal is ReflectionSubOptionSignal {
  return typeof (signal as { subOptionId?: unknown }).subOptionId === "string";
}

function collectKeywordSignals(text: string) {
  const normalized = text.toLowerCase();
  const extractedKeywords: string[] = [];
  const inferredCategories: MockReflectionCategoryId[] = [];
  const coachToneHints: string[] = [];
  const nextStepHints: string[] = [];

  for (const rule of keywordRules) {
    if (normalized.includes(rule.keyword)) {
      extractedKeywords.push(rule.keyword);
      if (rule.categoryId) inferredCategories.push(rule.categoryId);
      if (rule.coachToneHint) coachToneHints.push(rule.coachToneHint);
      if (rule.nextStepHint) nextStepHints.push(rule.nextStepHint);
    }
  }

  return {
    extractedKeywords: unique(extractedKeywords),
    inferredCategories: unique(inferredCategories),
    coachToneHints: unique(coachToneHints),
    nextStepHints: unique(nextStepHints),
  };
}

export function mapMockTestReflectionSignals(assessment: AssessmentPayload): MockTestReflectionSignals {
  const selectedCategories = assessment.mockReflectionCategories ?? [];
  const selectedDetails = assessment.mockReflectionDetails ?? [];
  const freeText = assessment.extraNotes ?? "";
  const keywordSignals = collectKeywordSignals(freeText);

  const prioritizedCategories = unique([...selectedCategories, ...keywordSignals.inferredCategories]);

  const categorySignals = [
    ...prioritizedCategories.map((categoryId) => categorySignalMap[categoryId]),
    ...selectedDetails.map((detailId) => subOptionSignalMap[detailId]),
  ];

  const reinforcedGroups = unique(categorySignals.map((s) => s.groupedReportArea));
  const coachToneHints = unique([
    ...categorySignals.flatMap((s) => s.coachNoteHints),
    ...keywordSignals.coachToneHints,
  ]);
  const nextStepHints = unique([
    ...categorySignals.flatMap((s) => s.nextStepHints),
    ...keywordSignals.nextStepHints,
  ]);

  return {
    reinforcedGroups,
    categorySignals: categorySignals.map((signal) => {
      if (hasSubOption(signal)) {
        return {
          categoryId: signal.categoryId,
          subOptionId: signal.subOptionId,
          groupedReportArea: signal.groupedReportArea,
          officialSkillAreas: signal.officialSkillAreas,
          reportEmphasis: signal.reportEmphasis,
          coachNoteHints: signal.coachNoteHints,
          nextStepHints: signal.nextStepHints,
        };
      }

      return {
        categoryId: signal.categoryId,
        groupedReportArea: signal.groupedReportArea,
        officialSkillAreas: signal.officialSkillAreas,
        reportEmphasis: signal.reportEmphasis,
        coachNoteHints: signal.coachNoteHints,
        nextStepHints: signal.nextStepHints,
      };
    }),
    coachToneHints,
    nextStepHints,
    extractedKeywords: keywordSignals.extractedKeywords,
  };
}

