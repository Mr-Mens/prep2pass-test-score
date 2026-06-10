import { WEAK_AREA_BEHAVIOUR_FOCUS } from "@/lib/adi-narrative";
import { WEAK_AREA_OPTIONS, type WeakAreaId } from "@/lib/constants";
import {
  isManoeuvreWeakArea,
  productMeta,
  RISK_TIER_POINTS,
  type RiskTier,
} from "@/lib/product-skill-map";
import type { GroupedRiskArea } from "@/lib/readiness-risk-areas";
import { syllabusLayerActive } from "@/lib/syllabus-coverage";
import type {
  AssessmentPayload,
  ReadinessLabel,
  SyllabusProgressSnapshot,
} from "@/lib/validation";

export type TestPassRiskItem = {
  id: string;
  faultArea: string;
  whyItMatters: string;
  practiceNext: string;
  severity: "high" | "moderate";
};

export type ReportPriority = {
  rank: 1 | 2 | 3;
  title: string;
  detail: string;
};

const PASS_FAULT_CATALOG: Partial<
  Record<
    WeakAreaId,
    Pick<TestPassRiskItem, "faultArea" | "whyItMatters" | "practiceNext">
  >
> = {
  mirrors: {
    faultArea: "Mirror checks",
    whyItMatters: "Late checks often lead to poor timing when changing speed, direction, or emerging.",
    practiceNext: "Make mirror checks before changing speed or direction, and say MSPSL aloud until it feels routine.",
  },
  junctions: {
    faultArea: "Junction observations",
    whyItMatters: "Late checks can lead to poor timing when emerging or turning.",
    practiceNext: "Slow earlier, check both ways properly, and only commit when the gap is clearly safe.",
  },
  roundabouts: {
    faultArea: "Roundabout lane positioning",
    whyItMatters: "Late lane choice or weak exit checks often create hesitation or last-second corrections.",
    practiceNext: "Choose your lane earlier on approach, keep observations through the exit, and match entry speed to traffic.",
  },
  speedControl: {
    faultArea: "Approach speed",
    whyItMatters: "Arriving too fast reduces time to assess hazards and can unsettle positioning at junctions.",
    practiceNext: "Slow the approach so you have more time to assess the road, then match speed to what you can see.",
  },
  lanePositioning: {
    faultArea: "Road positioning",
    whyItMatters: "Wide or drifting position can affect gap judgement and how other road users read your intentions.",
    practiceNext: "Hold a steady position with safe space around hazards and tighten your line before turns.",
  },
  movingOffSafely: {
    faultArea: "Moving off observations",
    whyItMatters: "Rushed pull-aways are a common test fault when observations are incomplete.",
    practiceNext: "Take a full observation routine before moving off and join traffic only when the gap is clearly safe.",
  },
  independentDriving: {
    faultArea: "Independent driving decisions",
    whyItMatters: "Under test you must follow signs or sat nav for several minutes without constant prompting.",
    practiceNext: "Start adding sat nav and road-sign following into normal lessons and plan lane choice earlier.",
  },
  forwardBayParking: {
    faultArea: "Forward bay parking observations",
    whyItMatters: "Examiners look for control and observations through the full manoeuvre, not just the final position.",
    practiceNext: "Keep the approach slow with observations through the full move into the bay.",
  },
  reverseBayParking: {
    faultArea: "Reverse bay parking control",
    whyItMatters: "Rushed reversing often costs observations or accurate positioning.",
    practiceNext: "Reverse slowly with all-round observations and accurate line control into the bay.",
  },
  pullUpOnRightReverse: {
    faultArea: "Pull up on the right and reverse",
    whyItMatters: "This manoeuvre combines positioning, observation, and rejoining traffic safely.",
    practiceNext: "Stop safely on the right, reverse two car lengths with full observations, then rejoin smoothly.",
  },
  parallelParking: {
    faultArea: "Parallel parking observations",
    whyItMatters: "Control matters, but missing observations during the move is a common fail point.",
    practiceNext: "Keep the manoeuvre slow with observations while positioning next to the kerb.",
  },
  countryRoads: {
    faultArea: "Meeting traffic on narrow roads",
    whyItMatters: "Limited space and sight lines need calm speed and position under pressure.",
    practiceNext: "Meet oncoming traffic calmly with sensible speed and hold your position on narrow sections.",
  },
  dualCarriageways: {
    faultArea: "Dual carriageway joining",
    whyItMatters: "Slip-road judgement and lane discipline are easy to lose under test pressure.",
    practiceNext: "Match joining speed on slip roads and keep lane discipline at higher speeds.",
  },
  motorways: {
    faultArea: "Motorway lane discipline",
    whyItMatters: "Even if not on every route, planning gaps early shows safe judgement at speed.",
    practiceNext: "Plan joining gaps early and avoid lingering in the middle lane without reason.",
  },
  nightDriving: {
    faultArea: "Driving in the dark",
    whyItMatters: "Reduced visibility makes speed judgement and observations harder under pressure.",
    practiceNext: "Use lights correctly and judge speed with reduced visibility before adding busy routes.",
  },
  weatherConditions: {
    faultArea: "Low-grip conditions",
    whyItMatters: "Rain and wind need earlier speed and space choices to stay smooth and safe.",
    practiceNext: "Leave more space and adjust speed early when grip is lower.",
  },
};

function tierScore(tier: RiskTier): number {
  return RISK_TIER_POINTS[tier];
}

function rankWeakAreas(ids: WeakAreaId[]): WeakAreaId[] {
  return Array.from(new Set(ids)).sort((a, b) => tierScore(productMeta(b).riskTier) - tierScore(productMeta(a).riskTier));
}

function weakAreaLabel(id: WeakAreaId): string {
  return WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function faultFromWeakArea(id: WeakAreaId, severity: "high" | "moderate"): TestPassRiskItem {
  const catalog = PASS_FAULT_CATALOG[id];
  const behaviour = WEAK_AREA_BEHAVIOUR_FOCUS[id];
  return {
    id: id,
    faultArea: catalog?.faultArea ?? weakAreaLabel(id),
    whyItMatters:
      catalog?.whyItMatters ??
      "This area is flagged in your assessment and is a common source of test faults under pressure.",
    practiceNext: catalog?.practiceNext ?? `Work with your instructor to ${behaviour}.`,
    severity,
  };
}

function independentDrivingRisk(syllabus: SyllabusProgressSnapshot | null | undefined): TestPassRiskItem | null {
  const cat = syllabus?.categoryProgress.find((c) => c.key === "independent_driving");
  if (!cat || cat.covered >= cat.total) return null;
  if (cat.covered > 1 && cat.completionPercent >= 50) return null;
  return {
    id: "syllabus_independent_driving",
    faultArea: "Independent driving",
    whyItMatters:
      "Under test you need to follow signs or sat nav for several minutes without constant prompting. Big gaps here increase test risk.",
    practiceNext:
      "Start adding sat nav, road-sign following, and planning ahead into normal lessons rather than leaving it until late.",
    severity: cat.covered === 0 ? "high" : "moderate",
  };
}

function confidenceRisk(confidenceLevel: number): TestPassRiskItem | null {
  if (confidenceLevel > 4) return null;
  return {
    id: "confidence_gap",
    faultArea: "Decision-making under pressure",
    whyItMatters: "Low confidence often shows up as hesitation or rushed decisions when traffic gets busier.",
    practiceNext: "Repeat familiar junction types until the routine feels steady, then add pressure in short bursts.",
    severity: "moderate",
  };
}

function mockFailRisk(mockTestTaken: AssessmentPayload["mockTestTaken"], mockTestResult: AssessmentPayload["mockTestResult"]): TestPassRiskItem | null {
  if (mockTestTaken !== "yes" || mockTestResult !== "fail") return null;
  return {
    id: "mock_fail",
    faultArea: "Test-day consistency",
    whyItMatters: "Your mock did not pass, which suggests pressure still exposes repeat fault themes.",
    practiceNext: "Treat mock fault themes as a checklist with your instructor and repeat corrections on test-style routes.",
    severity: "high",
  };
}

export function buildTestPassRisks(input: {
  weakAreas: WeakAreaId[];
  confidenceLevel: number;
  mockTestTaken: AssessmentPayload["mockTestTaken"];
  mockTestResult: AssessmentPayload["mockTestResult"];
  riskAreas: GroupedRiskArea[];
  syllabus?: SyllabusProgressSnapshot | null;
}): TestPassRiskItem[] {
  const items: TestPassRiskItem[] = [];
  const seen = new Set<string>();

  const push = (item: TestPassRiskItem) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  };

  const mockRisk = mockFailRisk(input.mockTestTaken, input.mockTestResult);
  if (mockRisk) push(mockRisk);

  for (const id of rankWeakAreas(input.weakAreas).slice(0, 4)) {
    const tier = productMeta(id).riskTier;
    push(faultFromWeakArea(id, tier === "critical" || tier === "high" ? "high" : "moderate"));
  }

  const indRisk = independentDrivingRisk(input.syllabus);
  if (indRisk) push(indRisk);

  const confRisk = confidenceRisk(input.confidenceLevel);
  if (confRisk) push(confRisk);

  if (items.length < 3) {
    for (const block of input.riskAreas) {
      if (block.severity !== "high" || block.skills.length === 0) continue;
      const skill = block.skills[0]!;
      if (seen.has(skill.key)) continue;
      push({
        id: skill.key,
        faultArea: skill.label,
        whyItMatters: block.summary.split(".")[0] ?? block.summary,
        practiceNext: `Work this into your next lesson with your instructor, focusing on ${skill.label.toLowerCase()} under light pressure first.`,
        severity: "high",
      });
      if (items.length >= 5) break;
    }
  }

  return items.slice(0, 5);
}

function testDatePriority(
  testBooked: AssessmentPayload["testBooked"],
  testDate: AssessmentPayload["testDate"],
  mockTestTaken: AssessmentPayload["mockTestTaken"],
): ReportPriority | null {
  if (testBooked !== "yes" || !testDate) return null;
  if (mockTestTaken === "yes") {
    return {
      rank: 3,
      title: "Polish before test day",
      detail:
        "Work backwards from your test date: tackle weaker areas first, then use the final lessons to maintain standard on familiar test routes.",
    };
  }
  return {
    rank: 3,
    title: "Add mock-test pressure",
    detail:
      "Once your main behaviours are steadier, complete a mock-test style drive before your test date so exam pressure is not a surprise.",
  };
}

export function buildTopPriorities(input: {
  weakAreas: WeakAreaId[];
  syllabus?: SyllabusProgressSnapshot | null;
  testBooked: AssessmentPayload["testBooked"];
  testDate: AssessmentPayload["testDate"];
  mockTestTaken: AssessmentPayload["mockTestTaken"];
  nextSteps: string[];
}): ReportPriority[] {
  const priorities: ReportPriority[] = [];
  const ranked = rankWeakAreas(input.weakAreas);

  if (ranked[0]) {
    const label = weakAreaLabel(ranked[0]).toLowerCase();
    priorities.push({
      rank: 1,
      title: `Tighten ${label}`,
      detail: WEAK_AREA_BEHAVIOUR_FOCUS[ranked[0]].replace(/^./, (c) => c.toUpperCase()) + ".",
    });
  } else {
    priorities.push({
      rank: 1,
      title: "Build consistent routines",
      detail: "Keep observations and decision-making steady on familiar routes before stretching onto harder junctions.",
    });
  }

  const syllabusFocus = input.syllabus?.nextLessonFocus[0];
  const indCat = input.syllabus?.categoryProgress.find((c) => c.key === "independent_driving");
  if (indCat && indCat.covered < indCat.total) {
    priorities.push({
      rank: 2,
      title: "Build independent driving",
      detail: "Start adding sat nav and road-sign following into normal lessons, with planning ahead built in.",
    });
  } else if (syllabusFocus) {
    priorities.push({
      rank: 2,
      title: `Cover ${syllabusFocus.toLowerCase()}`,
      detail: "This is a main recap area still to build into practice. Short, repeated practice is usually more useful than trying to cram everything.",
    });
  } else if (ranked[1] && !isManoeuvreWeakArea(ranked[1])) {
    priorities.push({
      rank: 2,
      title: `Improve ${weakAreaLabel(ranked[1]).toLowerCase()}`,
      detail: WEAK_AREA_BEHAVIOUR_FOCUS[ranked[1]].replace(/^./, (c) => c.toUpperCase()) + ".",
    });
  } else {
    priorities.push({
      rank: 2,
      title: "Stretch your road experience",
      detail: "Add one road type or manoeuvre you avoid, then repeat it until the routine feels calm.",
    });
  }

  const testPriority = testDatePriority(input.testBooked, input.testDate, input.mockTestTaken);
  if (testPriority) {
    priorities.push(testPriority);
  } else if (input.mockTestTaken !== "yes") {
    priorities.push({
      rank: 3,
      title: "Book a mock when ready",
      detail:
        "A mock will be useful once the basics are consistent, because it shows how you cope under pressure.",
    });
  } else {
    const fallback = input.nextSteps[input.nextSteps.length - 1];
    priorities.push({
      rank: 3,
      title: "Take this to your next lesson",
      detail:
        fallback ??
        "Agree one observable target with your instructor for the next session and repeat it on two familiar routes.",
    });
  }

  return priorities.slice(0, 3) as ReportPriority[];
}

export function roadmapStatusLabel(syllabus: SyllabusProgressSnapshot): string {
  const pct = syllabus.completionPercent;
  if (pct < 35) return "Early foundations";
  if (pct < 60) return "Building consistency";
  if (pct < 85) return "Nearly complete";
  return "Polishing for test";
}

export function readinessBandStyles(label: ReadinessLabel): {
  badge: string;
  bar: string;
  ring: string;
} {
  switch (label) {
    case "Needs More Time":
      return {
        badge: "bg-red-50 text-red-900 ring-red-200",
        bar: "from-red-500 via-red-400 to-amber-400",
        ring: "text-red-600",
      };
    case "Building Consistency":
      return {
        badge: "bg-amber-50 text-amber-950 ring-amber-200",
        bar: "from-amber-500 via-amber-400 to-yellow-400",
        ring: "text-amber-600",
      };
    case "Nearly Test Ready":
      return {
        badge: "bg-lime-50 text-lime-950 ring-lime-200",
        bar: "from-lime-500 via-emerald-400 to-teal-400",
        ring: "text-emerald-600",
      };
    case "Test Ready":
      return {
        badge: "bg-teal-50 text-teal-950 ring-teal-200",
        bar: "from-teal-600 via-emerald-500 to-green-400",
        ring: "text-teal-600",
      };
  }
}

export function independentDrivingGapSeverity(
  assessment: AssessmentPayload,
  syllabus: SyllabusProgressSnapshot | null | undefined,
): "none" | "moderate" | "severe" {
  const weak = assessment.weakAreas.includes("independentDriving");
  if (!syllabusLayerActive(assessment)) {
    return weak ? "severe" : "none";
  }
  const cat = syllabus?.categoryProgress.find((c) => c.key === "independent_driving");
  if (!cat) return weak ? "severe" : "none";
  if (weak || cat.covered === 0) return "severe";
  if (cat.completionPercent < 50) return "moderate";
  return "none";
}

export function applyIndependenceReadinessCeiling(
  score: number,
  assessment: AssessmentPayload,
  syllabus: SyllabusProgressSnapshot | null | undefined,
): number {
  const gap = independentDrivingGapSeverity(assessment, syllabus);
  if (gap === "none") return score;

  const strongEvidence =
    assessment.mockTestTaken === "yes" &&
    assessment.mockTestResult === "pass" &&
    assessment.lessonsTaken >= 25;

  if (gap === "severe") {
    if (strongEvidence) return Math.min(score, 78);
    return Math.min(score, 68);
  }
  return Math.min(score, 74);
}
