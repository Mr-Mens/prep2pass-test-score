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
import { pickCopyVariant, reportCopySalt } from "./deterministic-report-copy";
import { sortGroupedRiskAreasByImpact, type GroupedRiskArea, type RiskAreaSkill } from "./readiness-risk-areas";
import type { AssessmentPayload } from "./validation";
import type { DeterministicReadinessResult, ReadinessLabel } from "./validation";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Five-pillar model (UK ADI-style): each pillar is scored 0-100, then blended.
 * Safety is weighted highest; manoeuvre-only self-report is damped on safety/decision;
 * mock pass lifts test-day and independence; confidence and lesson count are light tail modifiers.
 */
export const READINESS_PILLAR_WEIGHTS = {
  safety: 0.3,
  consistency: 0.22,
  decisionMaking: 0.2,
  independence: 0.14,
  testDayReliability: 0.14,
} as const;

/** Ordered bands for product copy and debugging (label uses inclusive ranges in `labelForScore`). */
export const READINESS_SCORE_LABEL_GUIDE = [
  { maxScore: 44, label: "Needs More Time" as const },
  { maxScore: 64, label: "Building Consistency" as const },
  { maxScore: 79, label: "Nearly Test Ready" as const },
  { maxScore: 100, label: "Test Ready" as const },
] as const;

const JUNCTION_OBSERVATION_CORE = new Set<WeakAreaId>(["mirrors", "junctions", "roundabouts"]);
const CORE_CONTROL_IDS = new Set<WeakAreaId>(["speedControl", "lanePositioning", "movingOffSafely"]);

function labelForScore(score: number): ReadinessLabel {
  if (score <= 44) return "Needs More Time";
  if (score <= 64) return "Building Consistency";
  if (score <= 79) return "Nearly Test Ready";
  return "Test Ready";
}

const weakAreaLabel = (id: WeakAreaId) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id;

function tierUnits(id: WeakAreaId): number {
  return RISK_TIER_POINTS[productMeta(id).riskTier];
}

function uniqueWeakAreas(assessment: AssessmentPayload): WeakAreaId[] {
  return Array.from(new Set(assessment.weakAreas));
}

function onlyManoeuvreWeakAreas(ids: WeakAreaId[]): boolean {
  return ids.length > 0 && ids.every((id) => isManoeuvreWeakArea(id));
}

/** Mirrors / junctions / roundabouts carry more safety and decision weight than bays. */
function weakSafetyPenaltyUnits(ids: WeakAreaId[]): number {
  if (ids.length === 0) return 0;
  let sum = 0;
  for (const id of ids) {
    const u = tierUnits(id);
    if (JUNCTION_OBSERVATION_CORE.has(id)) sum += u * 1.24;
    else if (isManoeuvreWeakArea(id)) sum += u * 0.28;
    else if (CORE_CONTROL_IDS.has(id)) sum += u * 1.05;
    else sum += u * 0.78;
  }
  return sum;
}

function weakConsistencyPenaltyUnits(ids: WeakAreaId[]): number {
  if (ids.length === 0) return 0;
  let sum = 0;
  for (const id of ids) {
    const u = tierUnits(id);
    if (JUNCTION_OBSERVATION_CORE.has(id)) sum += u * 1.14;
    else if (isManoeuvreWeakArea(id)) sum += u * 0.58;
    else if (CORE_CONTROL_IDS.has(id)) sum += u * 1.02;
    else sum += u * 0.92;
  }
  return sum;
}

function weakDecisionPenaltyUnits(ids: WeakAreaId[]): number {
  if (ids.length === 0) return 0;
  let sum = 0;
  for (const id of ids) {
    const u = tierUnits(id);
    if (id === "junctions" || id === "roundabouts" || id === "speedControl") sum += u * 1.18;
    else if (id === "mirrors") sum += u * 0.72;
    else if (CORE_CONTROL_IDS.has(id)) sum += u * 0.88;
    else if (id === "independentDriving") sum += u * 1.15;
    else if (isManoeuvreWeakArea(id)) sum += u * 0.26;
    else sum += u * 0.8;
  }
  return sum;
}

function clusterPenalty(ids: WeakAreaId[]): number {
  const set = new Set(ids);
  let p = 0;
  for (const c of WEAK_AREA_CLUSTERS) {
    if (set.has(c.a) && set.has(c.b)) p += c.penalty;
  }
  return p;
}

/** More distinct weak areas → stronger “pattern, not slip” signal (ADI-style). */
function repetitionMultiplier(uniqueCount: number): number {
  if (uniqueCount <= 1) return 1;
  const spread = 1 + 0.19 * (uniqueCount - 1);
  const tail = uniqueCount >= 5 ? 0.2 : 0;
  return spread + tail;
}

function daysUntilTest(assessment: AssessmentPayload): number | null {
  if (assessment.testBooked !== "yes" || !assessment.testDate) return null;
  const test = new Date(assessment.testDate);
  if (Number.isNaN(test.getTime())) return null;
  return (test.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

function pillarSafety(assessment: AssessmentPayload, ids: WeakAreaId[], rep: number, parkingOnly: boolean): number {
  let s = 92;
  s -= assessment.seriousFaults * 31;
  s -= Math.min(20, assessment.drivingFaults * 0.68);

  let weakPen = weakSafetyPenaltyUnits(ids) * rep;
  if (parkingOnly) weakPen = Math.min(weakPen, 6.5);
  weakPen = Math.min(weakPen, 34);
  s -= weakPen;

  if (assessment.mockTestTaken === "yes" && assessment.mockTestResult === "fail") s -= 16;
  return clamp(s, 0, 100);
}

function pillarConsistency(assessment: AssessmentPayload, ids: WeakAreaId[], rep: number, parkingOnly: boolean): number {
  let s = 84;
  s -= Math.min(44, assessment.drivingFaults * 1.35);

  let weakPen = weakConsistencyPenaltyUnits(ids) * rep + clusterPenalty(ids) * 0.85;
  if (parkingOnly) weakPen *= 0.52;
  weakPen = Math.min(weakPen, 38);
  s -= weakPen;

  if (assessment.lessonsTaken < 8) s -= 6;
  else if (assessment.lessonsTaken < 14) s -= 4;

  if (assessment.seriousFaults > 0) s -= 8 + assessment.seriousFaults * 4;
  return clamp(s, 0, 100);
}

function pillarDecisionMaking(assessment: AssessmentPayload, ids: WeakAreaId[], rep: number, parkingOnly: boolean): number {
  let s = 86;
  s -= assessment.seriousFaults * 14;

  let weakPen = weakDecisionPenaltyUnits(ids) * rep;
  if (parkingOnly) weakPen = Math.min(weakPen, 5.2);
  weakPen = Math.min(weakPen, 34);
  s -= weakPen;

  if (assessment.mockTestTaken === "yes" && assessment.mockTestResult === "fail") s -= 16;
  return clamp(s, 0, 100);
}

function pillarIndependence(assessment: AssessmentPayload, ids: WeakAreaId[]): number {
  let s = 74;

  if (ids.includes("independentDriving")) s -= 15;

  if (assessment.lessonsTaken < 10) s -= 10;
  else if (assessment.lessonsTaken < 18) s -= 5;
  else if (assessment.lessonsTaken > 40) s += 2;

  if (assessment.mockTestTaken === "yes" && assessment.mockTestResult === "pass") s += 10;
  if (assessment.mockTestTaken === "no") s -= 7;
  if (assessment.mockTestTaken === "yes" && assessment.mockTestResult === "fail") s -= 11;

  const higherSpeed = ids.some((id) => id === "dualCarriageways" || id === "motorways" || id === "countryRoads");
  if (higherSpeed) s -= 3;

  return clamp(s, 0, 100);
}

function pillarTestDayReliability(assessment: AssessmentPayload): number {
  let s = 60;

  if (assessment.mockTestTaken === "yes" && assessment.mockTestResult === "pass") s += 24;
  if (assessment.mockTestTaken === "yes" && assessment.mockTestResult === "fail") s -= 26;
  if (assessment.mockTestTaken === "no") s -= 8;

  s -= Math.min(14, assessment.drivingFaults * 0.45);
  s -= assessment.seriousFaults * 8;

  const days = daysUntilTest(assessment);
  if (days !== null && days > 0 && days < 10) s -= 6;

  return clamp(s, 0, 100);
}

function blendPillars(
  safety: number,
  consistency: number,
  decision: number,
  independence: number,
  testDay: number,
): number {
  const w = READINESS_PILLAR_WEIGHTS;
  return (
    safety * w.safety +
    consistency * w.consistency +
    decision * w.decisionMaking +
    independence * w.independence +
    testDay * w.testDayReliability
  );
}

function computePillarReadinessScore(assessment: AssessmentPayload): number {
  const ids = uniqueWeakAreas(assessment);
  const rep = repetitionMultiplier(ids.length);
  const parkingOnly = onlyManoeuvreWeakAreas(ids);

  const safety = pillarSafety(assessment, ids, rep, parkingOnly);
  const consistency = pillarConsistency(assessment, ids, rep, parkingOnly);
  const decision = pillarDecisionMaking(assessment, ids, rep, parkingOnly);
  const independence = pillarIndependence(assessment, ids);
  const testDay = pillarTestDayReliability(assessment);

  let composite = blendPillars(safety, consistency, decision, independence, testDay);

  // Light modifiers only (not dominant).
  composite += (assessment.confidenceLevel - 6) * 0.32;
  composite += clamp((assessment.lessonsTaken - 18) * 0.024, -1.2, 2.0);

  return clamp(Math.round(composite), 0, 100);
}

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
  salt: number,
): string {
  const focus = skills.map((s) => s.label).join(" · ");
  const focusOr = (fallback: string) => (focus || fallback);

  if (skills.length === 0 && highlights.length) {
    const h0 = highlights[0];
    if (/serious fault/i.test(h0)) {
      return pickCopyVariant(salt, "grp:serious", [
        `${h0} Drill the repeat themes with your instructor until corrections are verbalised before each move.`,
        `${h0} Turn each correction into a spoken routine before you move, then repeat on the same road until it sticks.`,
      ]);
    }
    if (/mock test was a fail/i.test(h0)) {
      return pickCopyVariant(salt, "grp:mockfail", [
        "Mock was a fail. Rehearse junctions and roundabouts first, then rebuild speed and observations on the same roads.",
        "Mock did not pass. Re-run the same route type with your instructor until junction timing and observations feel calm, not rushed.",
      ]);
    }
    if (/driving[- ]fault/i.test(h0)) {
      return pickCopyVariant(salt, "grp:minors", [
        "Fault count points to rhythm, not slips. Tighten one routine per lesson on routes you already know.",
        "Higher minors usually mean habit drift. Pick one default routine per lesson and keep the route familiar until it steadies.",
      ]);
    }
    return h0;
  }

  if (severity === "high") {
    const f = focusOr("these routines");
    return pickCopyVariant(salt, "grp:high", [
      `Front-load test prep: ${f}, with short timed repeats until each step is spoken before the car moves.`,
      `Put ${f} first on your prep list: same junction or routine on repeat until timing feels boring, then add traffic.`,
      `Treat ${f} as test-week priority: 60-second rehearsal blocks your instructor can score objectively before you widen the route.`,
    ]);
  }
  if (severity === "moderate") {
    const f = focusOr("These areas");
    return pickCopyVariant(salt, "grp:mod", [
      `${f}: one narrow win per week (one junction type, one speed band), then reconnect on a mock.`,
      `${f}: lock one measurable improvement per lesson, then prove it on a short mock section before you move on.`,
      `${f}: alternate “technique lessons” with “pressure lessons” so improvements survive when you are tired.`,
    ]);
  }
  const f = focusOr("These areas");
  return pickCopyVariant(salt, "grp:low", [
    `${f}: light polish. Keep one refresher drive before test week so habits stay automatic.`,
    `${f}: maintenance mode. One refresher route near your centre the week before test day is usually enough.`,
    `${f}: small nudges only. Keep mileage honest so polish does not hide gaps under exam nerves.`,
  ]);
}

function buildGroupedRiskAreas(assessment: AssessmentPayload, salt: number): GroupedRiskArea[] {
  const buckets: Partial<Record<OfficialGroupKey, RiskBucket>> = {};
  const uniqueWeak = uniqueWeakAreas(assessment);

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
    const summary = buildGroupSummary(skills, severity, highlights, salt);
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
      summary: pickCopyVariant(salt, "grp:empty", [
        "No major self-reported hotspots, but it is still worth one mock route near your test centre to pressure-test your default routines.",
        "You did not flag big weak-area themes here; still schedule a mock on roads around your centre so exam nerves meet familiar junctions.",
        "Self-report looks quiet on hotspots. Use a mock to confirm your default mirror and junction timing under test-style instructions.",
      ]),
    });
  }

  return sortGroupedRiskAreasByImpact(groups).slice(0, 8);
}

function buildNextSteps(assessment: AssessmentPayload, salt: number): string[] {
  const steps: string[] = [];
  const w = new Set(assessment.weakAreas);

  if (assessment.lessonsTaken < 15) {
    steps.push(
      pickCopyVariant(salt, "next:lessons15", [
        "Aim for enough guided mileage that independent driving feels predictable, not improvised.",
        "Prioritise steady weekly mileage until independent routes feel boringly predictable, not improvised each time.",
      ]),
    );
  }

  if (w.has("mirrors")) {
    steps.push(
      pickCopyVariant(salt, "next:mirrors", [
        "Run a 20-minute drill each lesson: MSPSL on every pull-away, lane change, and approach to junctions.",
        "Start three lessons in a row with mirror-first MSPSL: every signal, brake, and lane change gets a named check before the wheels turn.",
      ]),
    );
  }

  if (w.has("junctions")) {
    steps.push(
      pickCopyVariant(salt, "next:junctions", [
        "Repeat emerging scenarios with your instructor until your default is early observations, not late speed changes.",
        "Loop the same two junction types until your approach speed is set early and observations happen before you commit.",
      ]),
    );
  }

  if (w.has("roundabouts")) {
    steps.push(
      pickCopyVariant(salt, "next:roundabouts", [
        "Use one lesson block on roundabouts only: approach speed first, then lane choice, then observations on exit.",
        "Split roundabouts into approach, lane, exit: rehearse each phase verbally until the routine survives busy periods.",
      ]),
    );
  }

  if (w.has("movingOffSafely")) {
    steps.push(
      pickCopyVariant(salt, "next:movingOff", [
        "Verbalise the six-point check on every move off until it takes under three seconds without rushing.",
        "On every move off, say the observation sequence out loud until your instructor hears it before you lift the clutch fully.",
      ]),
    );
  }

  if (w.has("lanePositioning") || w.has("speedControl")) {
    steps.push(
      pickCopyVariant(salt, "next:posSpeed", [
        "Pair positioning with speed: pick a reference point on the road and rehearse safe gaps in varied traffic.",
        "Run paired drills: same road, same limit, focus only on safe gaps and lane discipline until both feel linked.",
      ]),
    );
  }

  if (assessment.weakAreas.some((id) => isManoeuvreWeakArea(id))) {
    steps.push(
      pickCopyVariant(salt, "next:manoeuvres", [
        "Book time for each manoeuvre you ticked: one verbal routine (mirrors → move → observations), then repeat until it feels automatic under test pace.",
        "For each manoeuvre flagged, rehearse one slow template drive, then repeat under mild time pressure until observations stay early.",
      ]),
    );
  }

  if (w.has("independentDriving")) {
    steps.push(
      pickCopyVariant(salt, "next:indep", [
        "On independent routes, narrate decisions 30 seconds early so planning stays ahead of the car.",
        "On sign or sat-nav sections, practise naming the next hazard and lane decision well before you reach it.",
      ]),
    );
  }

  if (w.has("countryRoads") || w.has("dualCarriageways") || w.has("motorways")) {
    steps.push(
      pickCopyVariant(salt, "next:fastRoad", [
        "Schedule at least one higher-speed road session to match how you will use slip roads and lane discipline near your test area.",
        "Add a higher-speed session that mirrors your test area: joining, leaving, and lane discipline at real traffic speeds.",
      ]),
    );
  }

  if (w.has("nightDriving") || w.has("weatherConditions")) {
    steps.push(
      pickCopyVariant(salt, "next:conditions", [
        "If conditions apply before your test, repeat the same junctions in rain or darkness so judgement stays consistent.",
        "Revisit familiar junctions in reduced grip or low light so your speed judgement does not reset on test week.",
      ]),
    );
  }

  if (assessment.mockTestTaken === "no") {
    steps.push(
      pickCopyVariant(salt, "next:noMock", [
        "Book a mock test at least two weeks before your date. It is the closest safe proxy to exam pressure.",
        "Plan a mock early enough that a poor result becomes data, not panic: two weeks ahead is a sensible minimum.",
      ]),
    );
  } else if (assessment.mockTestResult === "fail") {
    steps.push(
      pickCopyVariant(salt, "next:mockFail", [
        "Take one focused mock on weaknesses only, then a full mock to confirm improvements transfer under time pressure.",
        "After a fail mock, run a half-mock on the worst two themes, then a full mock once your instructor signs off verbally.",
      ]),
    );
  } else if (assessment.mockTestResult === "pass") {
    steps.push(
      pickCopyVariant(salt, "next:mockPass", [
        "Keep one refresher mock close to test week to prevent complacency. Pass mocks are confidence, not a guarantee.",
        "Slot a light refresher mock near test day so confidence does not replace early observations under instruction style.",
      ]),
    );
  }

  if (assessment.seriousFaults > 0) {
    steps.push(
      pickCopyVariant(salt, "next:serious", [
        "Ask your instructor to log serious-fault themes explicitly and rehearse the exact corrections out loud.",
        "Treat serious-fault themes like a checklist: name the trigger, the correction, and repeat until your instructor hears it before the move.",
      ]),
    );
  }

  if (assessment.testBooked === "yes" && assessment.testDate) {
    steps.push(
      pickCopyVariant(salt, "next:booked", [
        "Work backwards from your test date: schedule tougher routes mid-week, then taper to confidence-building drives.",
        "With a date set, stack harder routes earlier in the fortnight, then shorter confidence drives as test day approaches.",
      ]),
    );
  }

  steps.push(
    pickCopyVariant(salt, "next:close", [
      "Bring this TestReady Score snapshot to your next lesson and agree one measurable target for the following session.",
      "Take this snapshot to your instructor and agree one observable win for next lesson, then revisit the score after.",
    ]),
  );

  return Array.from(new Set(steps)).slice(0, 6);
}

function recommendLessonHours(score: number, lessonsTaken: number, salt: number): string {
  if (score >= 80) {
    return pickCopyVariant(salt, "hrs:80", [
      "2 to 4 focused hours to polish test-day routines and core observations.",
      "About 2 to 4 hours of deliberate polish: observations, junction timing, and one refresher mock if you can.",
    ]);
  }
  if (score >= 65) {
    return pickCopyVariant(salt, "hrs:65", [
      "4 to 8 hours on your highest-impact risk themes, ideally with a mock in your test area.",
      "Roughly 4 to 8 hours aimed at your top two risk themes, plus a mock route near your centre.",
    ]);
  }
  if (score >= 45) {
    return pickCopyVariant(salt, "hrs:45", [
      "6 to 12 hours rebuilding consistency; agree priorities with your instructor week by week.",
      "Plan 6 to 12 hours around repeatable weekly targets so habits tighten instead of resetting each drive.",
    ]);
  }
  if (lessonsTaken < 10) {
    return pickCopyVariant(salt, "hrs:lt10", [
      "Allow enough structured hours that independent routines feel predictable before locking a test date.",
      "Build a solid base of guided hours first so independent driving stops feeling improvised.",
    ]);
  }
  return pickCopyVariant(salt, "hrs:default", [
    "Continue guided practice with clear weekly targets; revisit this score after a few focused lessons.",
    "Keep weekly lesson goals small and measurable, then rescore after a short block of practice.",
  ]);
}

function buildSummary(assessment: AssessmentPayload, score: number, salt: number): string {
  const weakLabels =
    assessment.weakAreas.length > 0
      ? assessment.weakAreas.map(weakAreaLabel).join(", ")
      : "no major self-reported weak areas";

  const mockLine =
    assessment.mockTestTaken === "yes"
      ? pickCopyVariant(salt, "sum:mockY", [
          `Your most recent mock was a ${assessment.mockTestResult === "pass" ? "pass" : assessment.mockTestResult === "fail" ? "fail" : "not recorded"}.`,
          `Latest mock outcome: ${assessment.mockTestResult === "pass" ? "pass" : assessment.mockTestResult === "fail" ? "fail" : "not recorded"}.`,
        ])
      : pickCopyVariant(salt, "sum:mockN", [
          "You have not taken a mock yet. That is normal, but it leaves pressure untested.",
          "No mock on record yet, which is common early on, but exam-style pressure is still unknown until you schedule one.",
        ]);

  const body = pickCopyVariant(salt, "sum:body", [
    `Based on ${assessment.lessonsTaken} lessons, ${assessment.seriousFaults} serious fault(s) and ${assessment.drivingFaults} driving fault(s) in a representative session, plus ${weakLabels}, TestReady Score estimates readiness at ${score}/100. Confidence is self-rated ${assessment.confidenceLevel}/10. ${mockLine}`,
    `Taking about ${assessment.lessonsTaken} lessons into account, with ${assessment.seriousFaults} serious fault(s) and ${assessment.drivingFaults} driving fault(s) from a representative session, and ${weakLabels}, TestReady Score sits at ${score}/100. Self-rated confidence is ${assessment.confidenceLevel}/10. ${mockLine}`,
    `Across ${assessment.lessonsTaken} lessons, the snapshot flags ${assessment.seriousFaults} serious fault(s) and ${assessment.drivingFaults} driving fault(s) in a representative session, alongside ${weakLabels}. TestReady Score comes out at ${score}/100, with confidence self-rated ${assessment.confidenceLevel}/10. ${mockLine}`,
  ]);

  const footer = pickCopyVariant(salt, "sum:foot", [
    "Risks are grouped by core driving skill areas aligned with common teaching frameworks for clarity. Prep2Pass is created by a DVSA-approved driving instructor; this is not an official DVSA product or score, and it should be reviewed with your instructor alongside on-road performance.",
    "Risk areas follow common teaching groupings for readability. Prep2Pass is created by a DVSA-approved driving instructor; this is not an official DVSA product or score, so use it with your instructor and what they see on the road.",
  ]);

  return `${body} ${footer}`;
}

/**
 * Deterministic scoring: five-pillar UK ADI-style model (safety-led blend of consistency, judgement, independence, test-day evidence).
 */
export function computeMockReadiness(assessment: AssessmentPayload): DeterministicReadinessResult {
  const score = computePillarReadinessScore(assessment);
  const readinessLabel = labelForScore(score);
  const copySalt = reportCopySalt(assessment);
  const riskAreas = buildGroupedRiskAreas(assessment, copySalt);
  const nextSteps = buildNextSteps(assessment, copySalt);
  const recommendedHours = recommendLessonHours(score, assessment.lessonsTaken, copySalt);
  const summary = buildSummary(assessment, score, copySalt);

  return {
    readinessScore: score,
    readinessLabel,
    riskAreas,
    recommendedHours,
    summary,
    nextSteps,
  };
}
