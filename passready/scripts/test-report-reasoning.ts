import { computeEstimatedLessonHours } from "../lib/estimated-lesson-hours";
import { buildReportViewModel, buildReportViewModelFromAssessment } from "../lib/report-view-model";
import { computeMockReadiness } from "../lib/scoring";
import { buildTestPassRisks, buildTopPriorities } from "../lib/report-insights";
import { buildFaithfulWeakAreaRiskCopy, evidenceBasedStrengthClause } from "../lib/report-reasoning";
import {
  readinessBandDisplayLabel,
  reconcileReadinessOutcome,
} from "../lib/readiness-calibration";
import type { AssessmentPayload } from "../lib/validation";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

const base: AssessmentPayload = {
  fullName: "Philip Test",
  email: "philip@test.com",
  lessonsTaken: 30,
  testBooked: "yes",
  testDate: "2026-06-23",
  mockTestTaken: "no",
  mockTestResult: "not_taken",
  seriousFaults: 0,
  drivingFaults: 5,
  confidenceLevel: 7,
  weakAreas: ["junctions"],
  weakAreaDetails: [],
  mockReflectionCategories: [],
  mockReflectionDetails: [],
  extraNotes: undefined,
  syllabusCaptureVersion: 1,
  topicsCovered: [],
};

function syllabusTopicsScenarioC(): string[] {
  const ids = [
    "cockpit_drill",
    "moving_off_safely",
    "stopping_safely",
    "clutch_control",
    "steering_control",
    "gear_changes",
    "mirrors_observations",
    "left_turns",
    "right_turns",
    "emerging_left",
    "emerging_right",
    "crossroads",
    "t_junctions",
    "roundabouts",
    "mini_roundabouts",
    "dual_carriageways",
    "country_roads",
    "one_way_systems",
    "meeting_traffic",
    "lane_discipline",
    "pedestrian_crossings",
    "speed_awareness",
    "hazard_awareness",
    "anticipation_planning",
    "use_of_mirrors_routine",
    "vulnerable_road_users",
    "parallel_parking",
    "forward_bay_parking",
  ];
  return ids;
}

console.log("Scenario A: broad junctions only");
const aRisk = buildFaithfulWeakAreaRiskCopy("junctions", []);
assert(aRisk.faultArea === "Junction consistency", "broad junction risk title");
assert(!aRisk.whyItMatters.includes("approach speed"), "no invented approach speed detail");
assert(aRisk.practiceNext.includes("identify the exact cause"), "broad practice guidance");

console.log("\nScenario B: junctions + turning right + positioning");
const bDetails: AssessmentPayload["weakAreaDetails"] = [
  {
    category: "junctions",
    subtopics: ["junctions_turning_right", "junctions_positioning"],
    notes: "Not sure how to position",
  },
];
const bRisk = buildFaithfulWeakAreaRiskCopy("junctions", bDetails);
assert(bRisk.faultArea === "Turning right positioning", "specific junction risk title");
const bPriority = buildTopPriorities({
  weakAreas: ["junctions"],
  weakAreaDetails: bDetails,
  testBooked: "yes",
  testDate: "2026-06-23",
  mockTestTaken: "no",
  nextSteps: [],
});
assert(bPriority[0]?.title === "Improve right-turn positioning", "specific priority title");
assert(bPriority[0]?.kind === "struggle", "struggle listed first in action plan");

console.log("\nScenario B2: action plan summarises uncovered syllabus topics");
const emptyRoadmap = computeMockReadiness({
  ...base,
  topicsCovered: [],
  weakAreas: ["junctions"],
  weakAreaDetails: bDetails,
});
const bFullPlan = buildTopPriorities({
  weakAreas: ["junctions"],
  weakAreaDetails: bDetails,
  syllabus: emptyRoadmap.syllabusProgress ?? null,
  topicsCovered: [],
  testBooked: "no",
  testDate: undefined,
  mockTestTaken: "no",
  nextSteps: [],
});
assert(bFullPlan.length === 2, `action plan stays concise (${bFullPlan.length})`);
assert(bFullPlan[1]?.kind === "syllabus", "syllabus summary follows struggles");
assert(bFullPlan[1]?.title === "Build remaining syllabus breadth", "syllabus gaps are summarised");
assert(bFullPlan[1]?.detail.includes("cockpit drill"), "summary names first teaching-order examples");

console.log("\nScenario C: roadmap gaps align score, band, and hours");
const cAssessment: AssessmentPayload = {
  ...base,
  topicsCovered: syllabusTopicsScenarioC(),
  weakAreas: ["junctions"],
};
const cResult = computeMockReadiness(cAssessment);
const cHours = computeEstimatedLessonHours({ ...cAssessment, syllabus: cResult.syllabusProgress ?? null }, cResult.readinessScore);
assert(cResult.readinessScore <= 74, `score capped for gaps (${cResult.readinessScore} <= 74)`);
assert(cResult.readinessLabel !== "Nearly Test Ready", "not Nearly Test Ready with major gaps");
assert(cResult.readinessLabel !== "Test Ready", "not Test Ready with major gaps");
assert(
  readinessBandDisplayLabel(cResult.readinessLabel, cResult.readinessScore) === "Approaching Test Standard" ||
    readinessBandDisplayLabel(cResult.readinessLabel, cResult.readinessScore) === "Developing",
  "display band stays below Nearly Test Ready",
);
assert(cHours.likely != null && cHours.likely <= 25, `hours stay realistic (${cHours.likely} <= 25)`);

console.log("\nScenario C2: example hour formula (10 + 2 + 4 + 1 = 17)");
const exampleHours = computeEstimatedLessonHours(
  {
    ...base,
    weakAreas: ["junctions"],
    confidenceLevel: 8,
    syllabus: {
      captureVersion: 1,
      topicsCoveredCount: 28,
      totalTopics: 36,
      completionPercent: 78,
      weightedCoverageRatio: 0.8,
      categoryProgress: [
        {
          key: "independent_driving",
          title: "Independent driving",
          covered: 0,
          total: 4,
          completionPercent: 0,
        },
        {
          key: "manoeuvres",
          title: "Manoeuvres",
          covered: 2,
          total: 5,
          completionPercent: 40,
        },
      ],
      uncoveredPriorityLabels: [],
      nextLessonFocus: [],
    },
  },
  67,
);
assert(exampleHours.likely === 17, `example hours = 17 (got ${exampleHours.likely})`);
assert(exampleHours.min === 12 && exampleHours.max === 22, "planning range 12–22");

console.log("\nScenario D: mock reflection junction observations");
const dRisks = buildTestPassRisks({
  weakAreas: ["junctions"],
  weakAreaDetails: [],
  confidenceLevel: 6,
  mockTestTaken: "yes",
  mockTestResult: "fail",
  mockReflectionDetails: ["junctions_poor_observation"],
  riskAreas: [],
});
assert(
  dRisks.some((r) => r.faultArea === "Junction observations" && r.source === "mock_evidence"),
  "mock observation fault allowed",
);

console.log("\nScenario E: supported positive strength wording");
const eStrengthAssessment: AssessmentPayload = {
  ...base,
  mockTestTaken: "yes",
  mockTestResult: "pass",
  weakAreas: [],
  topicsCovered: [
    "cockpit_drill",
    "moving_off_safely",
    "mirrors_observations",
    "left_turns",
    "right_turns",
    "roundabouts",
    "parallel_parking",
    "speed_awareness",
    "sat_nav_driving",
    "following_signs",
  ],
  syllabusCaptureVersion: 1,
};
const eStrength = evidenceBasedStrengthClause(eStrengthAssessment);
assert(Boolean(eStrength?.includes("mock pass")), "mock-supported strength allowed");
assert(!eStrength?.includes("observations and planning are generally sound"), "no generic unsupported praise");

console.log("\nScenario F: consistency check blocks top band when hours > 25");
const fHours = { min: 26, max: 36, likely: 31, openEndedHigh: false };
const fReconciled = reconcileReadinessOutcome({
  score: 82,
  label: "Nearly Test Ready",
  estimatedHours: fHours,
  assessment: { syllabusCaptureVersion: 1 },
  syllabus: null,
});
assert(fReconciled.label !== "Nearly Test Ready", "high hours prevent Nearly Test Ready");
assert(fReconciled.score <= 74, "score capped with high hours");

console.log("\nScenario G: live result keeps syllabus action plan without metadata");
const gAssessment: AssessmentPayload = {
  ...base,
  weakAreas: ["lanePositioning"],
  topicsCovered: [],
  syllabusCaptureVersion: 1,
};
const gModel = buildReportViewModelFromAssessment(gAssessment, {
  readinessScore: 44,
  readinessLabel: "Needs More Time",
  summary: "Test summary",
  nextSteps: [],
  riskAreas: [],
});
assert(gModel.topPriorities[0]?.title === "Clarify lane positioning difficulties", "lane positioning priority first");
assert(
  gModel.topPriorities[0]?.detail.includes("lane positioning is currently your weakest area"),
  "lane positioning uses singular grammar",
);
assert(gModel.topPriorities[1]?.title === "Build remaining syllabus breadth", "syllabus gaps summarised without metadata");
assert(gModel.topPriorities.length === 2, "live result keeps concise action plan");

console.log("\nScenario H: saved report rebuilds action plan from legacy syllabus metadata");
const hModel = buildReportViewModel({
  readinessScore: 44,
  readinessLabel: "Needs More Time",
  summary: "x",
  nextSteps: [],
  riskAreasRaw: [],
  weakAreasRaw: ["lanePositioning"],
  lessonsTaken: 20,
  mockTestTaken: false,
  mockTestResult: "not_taken",
  seriousFaults: 0,
  drivingFaults: 0,
  confidenceLevel: 6,
  testBooked: "no",
  testDate: undefined,
  rawMetadata: {
    syllabus: {
      captureVersion: 1,
      topicsCoveredCount: 5,
      totalTopics: 36,
      completionPercent: 14,
      weightedCoverageRatio: 0.2,
      categoryProgress: [],
      uncoveredPriorityLabels: ["Roundabouts", "Dual carriageways", "Sat nav driving"],
      nextLessonFocus: ["Roundabouts"],
    },
  },
});
assert(hModel.topPriorities.length === 2, "legacy saved report keeps concise action plan");
assert(hModel.topPriorities[1]?.kind === "syllabus", "legacy saved report includes syllabus summary");
assert(hModel.topPriorities[1]?.title === "Build remaining syllabus breadth", "legacy saved report summarises gaps");

console.log("\nScenario I: saved report uses topicsCoveredIds from syllabus snapshot");
const iModel = buildReportViewModel({
  readinessScore: 44,
  readinessLabel: "Needs More Time",
  summary: "x",
  nextSteps: [],
  riskAreasRaw: [],
  weakAreasRaw: ["lanePositioning"],
  lessonsTaken: 20,
  mockTestTaken: false,
  mockTestResult: "not_taken",
  seriousFaults: 0,
  drivingFaults: 0,
  confidenceLevel: 6,
  testBooked: "no",
  testDate: undefined,
  rawMetadata: {
    syllabus: {
      captureVersion: 1,
      topicsCoveredCount: 2,
      totalTopics: 36,
      completionPercent: 6,
      weightedCoverageRatio: 0.1,
      categoryProgress: [],
      uncoveredPriorityLabels: ["Roundabouts"],
      nextLessonFocus: ["Roundabouts"],
      topicsCoveredIds: ["cockpit_drill", "moving_off_safely"],
    },
  },
});
assert(iModel.topPriorities[1]?.title === "Build remaining syllabus breadth", "topicsCoveredIds rebuild syllabus summary");
assert(iModel.topPriorities.length === 2, "topicsCoveredIds keep action plan concise");

if (process.exitCode === 1) {
  console.error("\nReport reasoning tests failed.");
  process.exit(1);
}
console.log("\nAll report reasoning scenarios passed.");
