import {
  DVSA_GROUP_SCORE_WEIGHT,
  GROUP_ORDER,
  labelForSkillGroup,
  WEAK_AREA_TO_DVSA_GROUP,
  type DvsaSkillGroupId,
} from "./dvsa-skill-groups";
import { WEAK_AREA_OPTIONS, type WeakAreaId } from "./constants";
import { isManoeuvreWeakArea } from "./weak-area-migration";
import type { AssessmentPayload } from "./validation";
import type { DeterministicReadinessResult, GroupedRiskArea, ReadinessLabel } from "./validation";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const labelForScore = (score: number): ReadinessLabel => {
  if (score < 40) return "Not Ready";
  if (score < 70) return "Nearly Ready";
  return "Test Ready";
};

const weakAreaLabel = (id: WeakAreaId) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id;

/** One credible issue line per weak-area id (deterministic, instructor-style). */
const issueTemplates: Record<WeakAreaId, string> = {
  roundabouts:
    "Roundabouts: approach speed, lane discipline, and observations under test-style pressure.",
  forwardBayParking:
    "Forward bay parking: positioning into the bay with accuracy and observations through the move.",
  reverseBayParking:
    "Reverse bay parking: line control and all-round awareness while reversing into the bay.",
  pullUpOnRightReverse:
    "Pull up on the right and reverse: safe stop, two-car-length reverse, and rejoining with effective observations.",
  parallelParking:
    "Parallel parking: clearance, slow-speed control, and observations while positioning next to the kerb.",
  mirrors:
    "Mirrors & MSPSL: mirror routine before signalling, braking, or changing direction.",
  junctions:
    "Junctions: emerging and positioning with early observations — avoid late speed changes.",
  observations:
    "Observations: effective looks before moving off, changing direction, or near vulnerable road users.",
  speedControl: "Speed & limits: matching limits to conditions with safe judgement and planning.",
  clutchControl: "Clutch & biting point: smooth pull-aways and slow control when nerves rise.",
  independentDriving:
    "Independent driving: lane discipline and planning when following signs or sat-nav.",
};

const BASE_WEAK_PENALTY = 3.8;

function computeWeakAreaPenalty(assessment: AssessmentPayload): number {
  let penalty = 0;
  for (const id of assessment.weakAreas) {
    const gid = WEAK_AREA_TO_DVSA_GROUP[id];
    penalty += BASE_WEAK_PENALTY * DVSA_GROUP_SCORE_WEIGHT[gid];
  }
  return penalty;
}

function pickSeverity(groupId: DvsaSkillGroupId, issues: string[]): GroupedRiskArea["severity"] {
  const w = DVSA_GROUP_SCORE_WEIGHT[groupId];
  if (groupId === "basics" && issues.some((i) => i.includes("Serious fault"))) return "high";
  /** Manoeuvres: severity from how many distinct manoeuvres are flagged (each line = one manoeuvre). */
  if (groupId === "manoeuvres") {
    const n = issues.length;
    if (n >= 4) return "high";
    if (n >= 2) return "medium";
    return "low";
  }
  if (w >= 1.28 && issues.length >= 1) return "high";
  if (issues.length >= 3) return "high";
  if (w >= 1.15 && issues.length >= 2) return "medium";
  if (issues.length >= 2) return "medium";
  if (w < 1.1) return "low";
  return "medium";
}

function buildGroupedRiskAreas(assessment: AssessmentPayload): GroupedRiskArea[] {
  const bucket: Partial<Record<DvsaSkillGroupId, string[]>> = {};

  const push = (gid: DvsaSkillGroupId, line: string) => {
    if (!bucket[gid]) bucket[gid] = [];
    bucket[gid]!.push(line);
  };

  if (assessment.seriousFaults > 0) {
    push(
      "basics",
      `Serious fault(s) reported (${assessment.seriousFaults}) — treat as a priority with your instructor before test day.`,
    );
  }

  if (assessment.mockTestTaken === "yes" && assessment.mockTestResult === "fail") {
    push(
      "junctionsRoundaboutsCrossings",
      "Mock test was a fail — isolate behaviours that could become serious faults under exam conditions.",
    );
  }

  if (assessment.drivingFaults >= 12) {
    push(
      "basics",
      `Higher driving-fault count (${assessment.drivingFaults}) in a representative session — suggests consistency needs work, not one-off slips.`,
    );
  }

  for (const id of assessment.weakAreas) {
    const gid = WEAK_AREA_TO_DVSA_GROUP[id];
    const line = issueTemplates[id];
    if (line) push(gid, line);
  }

  const groups: GroupedRiskArea[] = [];

  for (const gid of GROUP_ORDER) {
    const issues = bucket[gid];
    if (!issues?.length) continue;
    const unique = Array.from(new Set(issues)).slice(0, 6);
    groups.push({
      group: labelForSkillGroup(gid),
      severity: pickSeverity(gid, unique),
      issues: unique,
    });
  }

  if (groups.length === 0) {
    groups.push({
      group: labelForSkillGroup("basics"),
      severity: "low",
      issues: [
        "No major self-reported hotspots — still worth pressure-testing your weakest routine on a mock route near your test centre.",
      ],
    });
  }

  return groups.slice(0, 8);
}

function buildNextSteps(assessment: AssessmentPayload): string[] {
  const steps: string[] = [];

  if (assessment.lessonsTaken < 15) {
    steps.push("Aim for enough guided mileage that independent driving feels predictable, not improvised.");
  }

  if (assessment.weakAreas.includes("mirrors") || assessment.weakAreas.includes("observations")) {
    steps.push("Run a 20-minute drill each lesson: MSPSL on every pull-away, lane change, and approach to junctions.");
  }

  if (assessment.weakAreas.includes("junctions")) {
    steps.push("Repeat emerging scenarios with your instructor until your default is early observations, not late speed changes.");
  }

  if (assessment.weakAreas.some((id) => isManoeuvreWeakArea(id))) {
    steps.push(
      "Book time for each manoeuvre you ticked: one verbal routine (mirrors → move → observations), then repeat until it feels automatic under test pace.",
    );
  }

  if (assessment.mockTestTaken === "no") {
    steps.push("Book a mock test at least two weeks before your date — it is the closest safe proxy to exam pressure.");
  } else if (assessment.mockTestResult === "fail") {
    steps.push("Take one focused mock on weaknesses only, then a full mock to confirm improvements transfer under time pressure.");
  } else if (assessment.mockTestResult === "pass") {
    steps.push("Keep one refresher mock close to test week to prevent complacency — pass mocks are confidence, not a guarantee.");
  }

  if (assessment.seriousFaults > 0) {
    steps.push("Ask your instructor to log serious-fault themes explicitly and rehearse the exact corrections out loud.");
  }

  if (assessment.testBooked === "yes" && assessment.testDate) {
    steps.push(
      "Work backwards from your test date: schedule tougher routes mid-week, then taper to confidence-building drives.",
    );
  }

  steps.push(
    "Bring this TestReady Score snapshot to your next lesson and agree one measurable target for the following session.",
  );

  return Array.from(new Set(steps)).slice(0, 6);
}

function recommendLessonHours(score: number, lessonsTaken: number): string {
  if (score >= 75) return "2–4 focused hours to polish consistency and test-day routines.";
  if (score >= 55) return "4–8 hours targeting your top risk areas, ideally including a mock.";
  if (lessonsTaken < 10) return "10–15+ structured hours before a test date is realistic for most learners at this stage.";
  return "6–12 hours with deliberate practice on the areas flagged above, plus at least one mock.";
}

function buildSummary(assessment: AssessmentPayload, score: number): string {
  const weakLabels =
    assessment.weakAreas.length > 0
      ? assessment.weakAreas.map(weakAreaLabel).join(", ")
      : "no major self-reported weak areas";

  const mockLine =
    assessment.mockTestTaken === "yes"
      ? `Your most recent mock was a ${assessment.mockTestResult === "pass" ? "pass" : assessment.mockTestResult === "fail" ? "fail" : "not recorded"}.`
      : "You have not taken a mock yet — that is normal, but it leaves pressure untested.";

  return `Based on ${assessment.lessonsTaken} lessons, ${assessment.seriousFaults} serious fault(s) and ${assessment.drivingFaults} driving fault(s) in a representative session, plus ${weakLabels}, TestReady Score estimates readiness at ${score}/100. Confidence is self-rated ${assessment.confidenceLevel}/10. ${mockLine} Risks are grouped using common practical test skill themes for clarity — not an official DVSA product — and should be reviewed with your instructor alongside on-road performance.`;
}

/**
 * Deterministic mock scoring for MVP preview. Replace with model + persisted scoring later.
 */
export function computeMockReadiness(assessment: AssessmentPayload): DeterministicReadinessResult {
  let score = 78;

  score -= computeWeakAreaPenalty(assessment);
  score -= assessment.seriousFaults * 12;
  score -= assessment.drivingFaults * 2.0;

  score += (assessment.confidenceLevel - 6) * 1.8;

  if (assessment.mockTestTaken === "yes") {
    if (assessment.mockTestResult === "pass") score += 9;
    if (assessment.mockTestResult === "fail") score -= 12;
  }

  if (assessment.lessonsTaken < 8) score -= 12;
  else if (assessment.lessonsTaken < 18) score -= 6;
  else if (assessment.lessonsTaken > 38) score += 4;

  if (assessment.testBooked === "yes" && assessment.testDate) {
    const test = new Date(assessment.testDate);
    if (!Number.isNaN(test.getTime())) {
      const days = (test.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (days < 10 && days > 0) score -= 3;
    }
  }

  score = clamp(Math.round(score), 0, 100);

  const readinessLabel = labelForScore(score);
  const riskAreas = buildGroupedRiskAreas(assessment);
  const nextSteps = buildNextSteps(assessment);
  const recommendedHours = recommendLessonHours(score, assessment.lessonsTaken);
  const summary = buildSummary(assessment, score);

  return {
    readinessScore: score,
    readinessLabel,
    riskAreas,
    recommendedHours,
    summary,
    nextSteps,
  };
}
