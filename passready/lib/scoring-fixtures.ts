import type { AssessmentPayload } from "./validation";

export type ScoringBenchmarkFixture = {
  name: string;
  inputs: AssessmentPayload;
  expectedScoreMin: number;
  expectedScoreMax: number;
  rationale: string;
};

const baseLearner = (): Omit<
  AssessmentPayload,
  | "lessonsTaken"
  | "testBooked"
  | "testDate"
  | "mockTestTaken"
  | "mockTestResult"
  | "seriousFaults"
  | "drivingFaults"
  | "confidenceLevel"
  | "weakAreas"
> => ({
  fullName: "Benchmark Learner",
  email: "benchmark@prep2pass.test",
  mockReflectionCategories: [],
  mockReflectionDetails: [],
  extraNotes: undefined,
});

function payload(p: Partial<AssessmentPayload> & Pick<AssessmentPayload, "lessonsTaken">): AssessmentPayload {
  return {
    ...baseLearner(),
    testBooked: "no",
    mockTestTaken: "yes",
    mockTestResult: "pass",
    seriousFaults: 0,
    drivingFaults: 4,
    confidenceLevel: 7,
    weakAreas: [],
    ...p,
  };
}

/**
 * Twelve benchmark learner profiles for calibrating `computeMockReadiness`.
 * Expected ranges are tuned to the current deterministic engine; widen bands if intentional retunes land outside.
 */
export const SCORING_BENCHMARK_FIXTURES: ScoringBenchmarkFixture[] = [
  {
    name: "Ideal prep — strong mock, high confidence",
    inputs: payload({
      lessonsTaken: 42,
      mockTestResult: "pass",
      seriousFaults: 0,
      drivingFaults: 3,
      confidenceLevel: 9,
      weakAreas: [],
    }),
    expectedScoreMin: 84,
    expectedScoreMax: 92,
    rationale: "High baseline, mock pass bonus, strong confidence, few faults, no weak-area penalty; should land in top band.",
  },
  {
    name: "Solid mid-pack — booked soon, average faults",
    inputs: payload({
      lessonsTaken: 28,
      testBooked: "yes",
      testDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      mockTestResult: "pass",
      seriousFaults: 0,
      drivingFaults: 8,
      confidenceLevel: 6,
      weakAreas: ["forwardBayParking"],
    }),
    expectedScoreMin: 72,
    expectedScoreMax: 86,
    rationale: "Near-term test applies small pressure; single low-tier weak area and moderate driving faults keep score in strong-ready band.",
  },
  {
    name: "Early learner — few lessons, no mock",
    inputs: payload({
      lessonsTaken: 6,
      mockTestTaken: "no",
      mockTestResult: "not_taken",
      seriousFaults: 0,
      drivingFaults: 6,
      confidenceLevel: 5,
      weakAreas: ["movingOffSafely", "junctions"],
    }),
    expectedScoreMin: 38,
    expectedScoreMax: 44,
    rationale: "Six lessons and no mock sit under a strict headline cap so the score does not read as half ready without test-style evidence.",
  },
  {
    name: "Mock fail — otherwise reasonable",
    inputs: payload({
      lessonsTaken: 22,
      mockTestResult: "fail",
      seriousFaults: 0,
      drivingFaults: 7,
      confidenceLevel: 6,
      weakAreas: ["roundabouts"],
    }),
    expectedScoreMin: 58,
    expectedScoreMax: 72,
    rationale: "Mock-fail penalty dominates over moderate faults; still no serious faults.",
  },
  {
    name: "Serious-fault signal — low driving count",
    inputs: payload({
      lessonsTaken: 30,
      mockTestResult: "pass",
      seriousFaults: 2,
      drivingFaults: 4,
      confidenceLevel: 7,
      weakAreas: [],
    }),
    expectedScoreMin: 52,
    expectedScoreMax: 68,
    rationale: "Serious faults carry heavy weight even with few minors and a pass mock.",
  },
  {
    name: "Many minors, no serious",
    inputs: payload({
      lessonsTaken: 35,
      mockTestResult: "pass",
      seriousFaults: 0,
      drivingFaults: 18,
      confidenceLevel: 7,
      weakAreas: ["speedControl", "lanePositioning"],
    }),
    expectedScoreMin: 66,
    expectedScoreMax: 74,
    rationale: "Many minors plus two critical roadcraft weaknesses should sit in Nearly Test Ready, not top-band ready.",
  },
  {
    name: "Weak-area cluster — mirrors + junctions + roundabouts",
    inputs: payload({
      lessonsTaken: 24,
      mockTestResult: "pass",
      seriousFaults: 0,
      drivingFaults: 9,
      confidenceLevel: 6,
      weakAreas: ["mirrors", "junctions", "roundabouts"],
    }),
    expectedScoreMin: 58,
    expectedScoreMax: 76,
    rationale: "Cluster bonuses on overlapping official groups push weak-area component toward cap alongside faults.",
  },
  {
    name: "Max weak-area pressure — diversified critical list",
    inputs: payload({
      lessonsTaken: 20,
      mockTestTaken: "no",
      mockTestResult: "not_taken",
      seriousFaults: 0,
      drivingFaults: 10,
      confidenceLevel: 5,
      weakAreas: [
        "mirrors",
        "speedControl",
        "junctions",
        "roundabouts",
        "lanePositioning",
      ],
    }),
    expectedScoreMin: 38,
    expectedScoreMax: 52,
    rationale: "Many critical ticks plus clusters hit capped weak penalty; no mock and low lessons compound downward.",
  },
  {
    name: "Low confidence anchor",
    inputs: payload({
      lessonsTaken: 18,
      mockTestResult: "pass",
      seriousFaults: 0,
      drivingFaults: 5,
      confidenceLevel: 3,
      weakAreas: ["reverseBayParking"],
    }),
    expectedScoreMin: 66,
    expectedScoreMax: 74,
    rationale: "Low confidence still nudges down but is capped; pass mock and modest faults keep a strong but bounded score under the lesson band cap.",
  },
  {
    name: "High lesson count, not booked, cautious driver",
    inputs: payload({
      lessonsTaken: 55,
      testBooked: "no",
      mockTestTaken: "no",
      mockTestResult: "not_taken",
      seriousFaults: 0,
      drivingFaults: 5,
      confidenceLevel: 6,
      weakAreas: [],
    }),
    expectedScoreMin: 68,
    expectedScoreMax: 82,
    rationale: "Lesson volume bonus helps; no mock removes pass uplift but avoids fail hit; neutral confidence.",
  },
  {
    name: "Borderline serious + weak areas",
    inputs: payload({
      lessonsTaken: 26,
      mockTestResult: "fail",
      seriousFaults: 1,
      drivingFaults: 12,
      confidenceLevel: 5,
      weakAreas: ["junctions", "mirrors"],
    }),
    expectedScoreMin: 32,
    expectedScoreMax: 42,
    rationale: "Serious fault, mock fail, stacked minors, and paired critical weak skills compound into Needs More Time territory.",
  },
  {
    name: "Parking-only weaknesses — higher tier mix",
    inputs: payload({
      lessonsTaken: 32,
      mockTestResult: "pass",
      seriousFaults: 0,
      drivingFaults: 6,
      confidenceLevel: 8,
      weakAreas: ["forwardBayParking", "reverseBayParking"],
    }),
    expectedScoreMin: 72,
    expectedScoreMax: 86,
    rationale: "Manoeuvre weak areas are lower product risk than core roadcraft; mock pass and good confidence keep band high.",
  },
];
