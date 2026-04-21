import { WEAK_AREA_OPTIONS, type WeakAreaId } from "./constants";
import {
  labelForOfficialGroup,
  officialSkillById,
  OFFICIAL_GROUP_ORDER,
  type OfficialGroupKey,
} from "./dvsa-ready-to-pass-framework";
import {
  isManoeuvreWeakArea,
  productMeta,
  RISK_TIER_POINTS,
  WEAK_AREA_CLUSTERS,
} from "./product-skill-map";
import { sortGroupedRiskAreasByImpact, type GroupedRiskArea, type RiskAreaSkill } from "./readiness-risk-areas";
import type { AssessmentPayload } from "./validation";
import type { DeterministicReadinessResult, ReadinessLabel } from "./validation";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const labelForScore = (score: number): ReadinessLabel => {
  if (score < 40) return "Not Ready";
  if (score < 70) return "Nearly Ready";
  return "Test Ready";
};

const weakAreaLabel = (id: WeakAreaId) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id;

type RiskBucket = {
  skills: Map<string, RiskAreaSkill>;
  highlights: string[];
};

function getBucket(
  buckets: Partial<Record<OfficialGroupKey, RiskBucket>>,
  groupKey: OfficialGroupKey,
): RiskBucket {
  if (!buckets[groupKey]) {
    buckets[groupKey] = { skills: new Map(), highlights: [] };
  }
  return buckets[groupKey]!;
}

function riskTierScore(t: "critical" | "high" | "medium" | "low"): number {
  return { critical: 3, high: 2, medium: 1, low: 0 }[t];
}

function pickGroupSeverity(
  groupKey: OfficialGroupKey,
  skills: RiskAreaSkill[],
  highlights: string[],
): GroupedRiskArea["severity"] {
  const serious = highlights.some((h) => /serious fault/i.test(h));
  const mockFail = highlights.some((h) => /mock test was a fail/i.test(h));
  const drivingBand = highlights.some((h) => /driving[- ]fault/i.test(h));

  if (groupKey === "basics" && serious) return "high";

  if (groupKey === "manoeuvres") {
    const manoeuvreKeys = new Set([
      "forwardBayParking",
      "reverseBayParking",
      "pullUpOnRightReverse",
      "parallelParking",
    ]);
    const n = skills.filter((s) => manoeuvreKeys.has(s.key)).length;
    if (n >= 4) return "high";
    if (n >= 2) return "moderate";
    if (n === 1) return "low";
  }

  if (skills.length === 0) {
    if (mockFail) return "moderate";
    if (drivingBand) return "moderate";
    if (highlights.length >= 2) return "moderate";
    return highlights.length ? "low" : "low";
  }

  const tierScores = skills.map((s) => {
    try {
      return riskTierScore(productMeta(s.key as WeakAreaId).riskTier);
    } catch {
      return 1;
    }
  });
  const sum = tierScores.reduce((a, b) => a + b, 0);
  const maxTier = Math.max(...tierScores);

  if (mockFail && skills.length >= 2 && groupKey === "junctions_roundabouts_crossings") return "high";
  if (sum >= 7 && skills.length >= 2) return "high";
  if (maxTier >= 3 && skills.length >= 3) return "high";

  if (mockFail) return "moderate";
  if (sum >= 4 || skills.length >= 2) return "moderate";
  if (maxTier >= 3) return "moderate";
  if (maxTier >= 2 && skills.length >= 1) return "moderate";
  return "low";
}

function buildGroupSummary(
  skills: RiskAreaSkill[],
  severity: GroupedRiskArea["severity"],
  highlights: string[],
): string {
  const focus = skills.map((s) => s.label).join(" · ");

  if (skills.length === 0 && highlights.length) {
    const h0 = highlights[0];
    if (/serious fault/i.test(h0)) {
      return `${h0} Drill the repeat themes with your instructor until corrections are verbalised before each move.`;
    }
    if (/mock test was a fail/i.test(h0)) {
      return "Mock was a fail. Rehearse junctions and roundabouts first, then rebuild speed and observations on the same roads.";
    }
    if (/driving[- ]fault/i.test(h0)) {
      return "Fault count points to rhythm, not slips. Tighten one routine per lesson on routes you already know.";
    }
    return h0;
  }

  if (severity === "high") {
    return `Front-load test prep: ${focus || "these routines"}, with short timed repeats until each step is spoken before the car moves.`;
  }
  if (severity === "moderate") {
    return `${focus || "These areas"}: one narrow win per week (one junction type, one speed band), then reconnect on a mock.`;
  }
  return `${focus || "These areas"}: light polish. Keep one refresher drive before test week so habits stay automatic.`;
}

function computeWeakAreaPenalty(assessment: AssessmentPayload): number {
  const unique = Array.from(new Set(assessment.weakAreas));
  let penalty = 0;
  for (const id of unique) {
    penalty += RISK_TIER_POINTS[productMeta(id).riskTier];
  }
  const set = new Set(unique);
  for (const c of WEAK_AREA_CLUSTERS) {
    if (set.has(c.a) && set.has(c.b)) penalty += c.penalty;
  }
  return penalty;
}

function buildGroupedRiskAreas(assessment: AssessmentPayload): GroupedRiskArea[] {
  const buckets: Partial<Record<OfficialGroupKey, RiskBucket>> = {};
  const uniqueWeak = Array.from(new Set(assessment.weakAreas));

  if (assessment.seriousFaults > 0) {
    getBucket(buckets, "basics").highlights.push(
      `Serious fault(s) reported (${assessment.seriousFaults}). Treat this as a priority with your instructor before test day.`,
    );
  }

  if (assessment.mockTestTaken === "yes" && assessment.mockTestResult === "fail") {
    getBucket(buckets, "junctions_roundabouts_crossings").highlights.push(
      "Mock test was a fail. Isolate behaviours that could become serious faults under exam conditions.",
    );
  }

  if (assessment.drivingFaults >= 12) {
    getBucket(buckets, "basics").highlights.push(
      `Higher driving-fault count (${assessment.drivingFaults}) in a representative session suggests consistency needs work, not one-off slips.`,
    );
  }

  for (const id of uniqueWeak) {
    const meta = productMeta(id);
    const official = officialSkillById(meta.officialSkillId);
    const chip: RiskAreaSkill = {
      key: id,
      label: weakAreaLabel(id),
      officialSkillId: meta.officialSkillId,
      officialSkillName: official?.name ?? "Driving skill",
    };
    getBucket(buckets, meta.groupKey).skills.set(id, chip);
  }

  const groups: GroupedRiskArea[] = [];

  for (const groupKey of OFFICIAL_GROUP_ORDER) {
    const b = buckets[groupKey];
    if (!b || (b.skills.size === 0 && b.highlights.length === 0)) continue;
    const skills = Array.from(b.skills.values());
    const highlights = b.highlights;
    const severity = pickGroupSeverity(groupKey, skills, highlights);
    const summary = buildGroupSummary(skills, severity, highlights);
    groups.push({
      groupKey,
      groupLabel: labelForOfficialGroup(groupKey),
      severity,
      skills,
      summary,
      highlights: highlights.length ? highlights : undefined,
    });
  }

  if (groups.length === 0) {
    groups.push({
      groupKey: "basics",
      groupLabel: labelForOfficialGroup("basics"),
      severity: "low",
      skills: [],
      summary:
        "No major self-reported hotspots, but it is still worth one mock route near your test centre to pressure-test your default routines.",
    });
  }

  return sortGroupedRiskAreasByImpact(groups).slice(0, 8);
}

function buildNextSteps(assessment: AssessmentPayload): string[] {
  const steps: string[] = [];
  const w = new Set(assessment.weakAreas);

  if (assessment.lessonsTaken < 15) {
    steps.push("Aim for enough guided mileage that independent driving feels predictable, not improvised.");
  }

  if (w.has("mirrors")) {
    steps.push("Run a 20-minute drill each lesson: MSPSL on every pull-away, lane change, and approach to junctions.");
  }

  if (w.has("junctions")) {
    steps.push("Repeat emerging scenarios with your instructor until your default is early observations, not late speed changes.");
  }

  if (w.has("roundabouts")) {
    steps.push("Use one lesson block on roundabouts only: approach speed first, then lane choice, then observations on exit.");
  }

  if (w.has("movingOffSafely")) {
    steps.push("Verbalise the six-point check on every move off until it takes under three seconds without rushing.");
  }

  if (w.has("lanePositioning") || w.has("speedControl")) {
    steps.push("Pair positioning with speed: pick a reference point on the road and rehearse safe gaps in varied traffic.");
  }

  if (assessment.weakAreas.some((id) => isManoeuvreWeakArea(id))) {
    steps.push(
      "Book time for each manoeuvre you ticked: one verbal routine (mirrors → move → observations), then repeat until it feels automatic under test pace.",
    );
  }

  if (w.has("independentDriving")) {
    steps.push("On independent routes, narrate decisions 30 seconds early so planning stays ahead of the car.");
  }

  if (w.has("countryRoads") || w.has("dualCarriageways") || w.has("motorways")) {
    steps.push("Schedule at least one higher-speed road session to match how you will use slip roads and lane discipline near your test area.");
  }

  if (w.has("nightDriving") || w.has("weatherConditions")) {
    steps.push("If conditions apply before your test, repeat the same junctions in rain or darkness so judgement stays consistent.");
  }

  if (assessment.mockTestTaken === "no") {
    steps.push("Book a mock test at least two weeks before your date. It is the closest safe proxy to exam pressure.");
  } else if (assessment.mockTestResult === "fail") {
    steps.push("Take one focused mock on weaknesses only, then a full mock to confirm improvements transfer under time pressure.");
  } else if (assessment.mockTestResult === "pass") {
    steps.push("Keep one refresher mock close to test week to prevent complacency. Pass mocks are confidence, not a guarantee.");
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
      : "You have not taken a mock yet. That is normal, but it leaves pressure untested.";

  return `Based on ${assessment.lessonsTaken} lessons, ${assessment.seriousFaults} serious fault(s) and ${assessment.drivingFaults} driving fault(s) in a representative session, plus ${weakLabels}, TestReady Score estimates readiness at ${score}/100. Confidence is self-rated ${assessment.confidenceLevel}/10. ${mockLine} Risks are grouped by core driving skill areas aligned with common teaching frameworks for clarity. This is not an official DVSA product or score, and it should be reviewed with your instructor alongside on-road performance.`;
}

/**
 * Deterministic scoring: serious and driving faults plus weighted weak-area and cluster penalties.
 */
export function computeMockReadiness(assessment: AssessmentPayload): DeterministicReadinessResult {
  let score = 78;

  score -= computeWeakAreaPenalty(assessment);
  score -= assessment.seriousFaults * 14.5;
  score -= assessment.drivingFaults * 1.65;

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
