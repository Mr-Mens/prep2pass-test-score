import type { WeakAreaId } from "@/lib/constants";
import { isManoeuvreWeakArea, productMeta, RISK_TIER_POINTS, type RiskTier } from "@/lib/product-skill-map";
import type { GroupedRiskArea } from "@/lib/readiness-risk-areas";
import {
  buildFaithfulPriorityCopy,
  buildFaithfulWeakAreaRiskCopy,
  mockReflectionRiskItems,
  type RiskEvidenceSource,
} from "@/lib/report-reasoning";
import { applyRoadmapReadinessScoreCeiling } from "@/lib/readiness-calibration";
import { syllabusLayerActive } from "@/lib/syllabus-coverage";
import type {
  AssessmentPayload,
  ReadinessLabel,
  SyllabusProgressSnapshot,
  WeakAreaDetailEntry,
} from "@/lib/validation";

export type TestPassRiskItem = {
  id: string;
  faultArea: string;
  whyItMatters: string;
  practiceNext: string;
  severity: "high" | "moderate";
  source?: RiskEvidenceSource;
};

export type ReportPriority = {
  rank: 1 | 2 | 3;
  title: string;
  detail: string;
};

function tierScore(tier: RiskTier): number {
  return RISK_TIER_POINTS[tier];
}

function rankWeakAreas(ids: WeakAreaId[]): WeakAreaId[] {
  return Array.from(new Set(ids)).sort((a, b) => tierScore(productMeta(b).riskTier) - tierScore(productMeta(a).riskTier));
}

function faultFromWeakArea(
  id: WeakAreaId,
  severity: "high" | "moderate",
  weakAreaDetails?: WeakAreaDetailEntry[],
): TestPassRiskItem {
  const copy = buildFaithfulWeakAreaRiskCopy(id, weakAreaDetails);
  return {
    id: id,
    faultArea: copy.faultArea,
    whyItMatters: copy.whyItMatters,
    practiceNext: copy.practiceNext,
    severity,
    source: copy.source,
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
      "Independent driving is a major test element. Big gaps here increase test risk because you must follow signs or sat nav without constant prompting.",
    practiceNext:
      "Start adding sat nav, road-sign following, and planning ahead into normal lessons rather than leaving it until late.",
    severity: cat.covered === 0 ? "high" : "moderate",
    source: "syllabus_gap",
  };
}

function manoeuvreSyllabusRisk(syllabus: SyllabusProgressSnapshot | null | undefined): TestPassRiskItem | null {
  const cat = syllabus?.categoryProgress.find((c) => c.key === "manoeuvres");
  if (!cat || cat.covered > 2) return null;
  return {
    id: "syllabus_manoeuvres",
    faultArea: "Manoeuvre coverage",
    whyItMatters:
      "Several manoeuvres still need building into normal lessons. Under test you may be asked to complete one you have not practised recently.",
    practiceNext:
      "Cover the remaining manoeuvres in short, repeated practice before moving into full mock-test style drives.",
    severity: cat.covered <= 1 ? "high" : "moderate",
    source: "syllabus_gap",
  };
}

function confidenceRisk(confidenceLevel: number): TestPassRiskItem | null {
  if (confidenceLevel > 4) return null;
  return {
    id: "confidence_gap",
    faultArea: "Decision-making under pressure",
    whyItMatters:
      "You rated your confidence low, which may show up as hesitation or rushed decisions when traffic gets busier.",
    practiceNext:
      "Repeat familiar junction types until the routine feels steady, then add pressure in short bursts with your instructor.",
    severity: "moderate",
    source: "confidence",
  };
}

function mockFailRisk(
  mockTestTaken: AssessmentPayload["mockTestTaken"],
  mockTestResult: AssessmentPayload["mockTestResult"],
): TestPassRiskItem | null {
  if (mockTestTaken !== "yes" || mockTestResult !== "fail") return null;
  return {
    id: "mock_fail",
    faultArea: "Test-day consistency",
    whyItMatters: "Your mock did not pass, which suggests pressure still exposes repeat fault themes.",
    practiceNext:
      "Treat mock fault themes as a checklist with your instructor and repeat corrections on test-style routes.",
    severity: "high",
    source: "mock_evidence",
  };
}

export function buildTestPassRisks(input: {
  weakAreas: WeakAreaId[];
  weakAreaDetails?: WeakAreaDetailEntry[];
  confidenceLevel: number;
  mockTestTaken: AssessmentPayload["mockTestTaken"];
  mockTestResult: AssessmentPayload["mockTestResult"];
  mockReflectionDetails?: AssessmentPayload["mockReflectionDetails"];
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

  if (input.mockTestTaken === "yes" && input.mockReflectionDetails?.length) {
    const assessmentStub = {
      mockTestTaken: input.mockTestTaken,
      mockReflectionDetails: input.mockReflectionDetails,
    } as AssessmentPayload;
    for (const mockItem of mockReflectionRiskItems(assessmentStub)) {
      push({
        id: mockItem.id,
        faultArea: mockItem.faultArea,
        whyItMatters: mockItem.whyItMatters,
        practiceNext: mockItem.practiceNext,
        severity: mockItem.severity,
        source: mockItem.source,
      });
    }
  }

  for (const id of rankWeakAreas(input.weakAreas).slice(0, 4)) {
    const tier = productMeta(id).riskTier;
    push(faultFromWeakArea(id, tier === "critical" || tier === "high" ? "high" : "moderate", input.weakAreaDetails));
  }

  const indRisk = independentDrivingRisk(input.syllabus);
  if (indRisk) push(indRisk);

  const manRisk = manoeuvreSyllabusRisk(input.syllabus);
  if (manRisk) push(manRisk);

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
        source: "inference",
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
  weakAreaDetails?: WeakAreaDetailEntry[];
  syllabus?: SyllabusProgressSnapshot | null;
  testBooked: AssessmentPayload["testBooked"];
  testDate: AssessmentPayload["testDate"];
  mockTestTaken: AssessmentPayload["mockTestTaken"];
  nextSteps: string[];
}): ReportPriority[] {
  const priorities: ReportPriority[] = [];
  const ranked = rankWeakAreas(input.weakAreas);

  if (ranked[0]) {
    const copy = buildFaithfulPriorityCopy(ranked[0], input.weakAreaDetails);
    priorities.push({ rank: 1, title: copy.title, detail: copy.detail });
  } else {
    priorities.push({
      rank: 1,
      title: "Build consistent routines",
      detail:
        "Keep observations and decision-making steady on familiar routes before stretching onto harder junctions.",
    });
  }

  const indCat = input.syllabus?.categoryProgress.find((c) => c.key === "independent_driving");
  const manCat = input.syllabus?.categoryProgress.find((c) => c.key === "manoeuvres");
  const syllabusFocus = input.syllabus?.nextLessonFocus[0];

  if (indCat && indCat.covered === 0) {
    priorities.push({
      rank: 2,
      title: "Build independent driving",
      detail:
        "Independent driving is a major gap before test readiness. Start adding sat nav and road-sign following into normal lessons with planning ahead built in.",
    });
  } else if (manCat && manCat.covered <= 2) {
    priorities.push({
      rank: 2,
      title: "Complete manoeuvre coverage",
      detail:
        "Several manoeuvres still need more practice. Cover the remaining manoeuvres in short, repeated sessions before mock-test style drives.",
    });
  } else if (indCat && indCat.covered < indCat.total) {
    priorities.push({
      rank: 2,
      title: "Build independent driving",
      detail: "Start adding sat nav and road-sign following into normal lessons, with planning ahead built in.",
    });
  } else if (syllabusFocus) {
    priorities.push({
      rank: 2,
      title: `Cover ${syllabusFocus.toLowerCase()}`,
      detail:
        "This is a main recap area still to build into practice. Short, repeated practice is usually more useful than trying to cram everything.",
    });
  } else if (ranked[1] && !isManoeuvreWeakArea(ranked[1])) {
    const copy = buildFaithfulPriorityCopy(ranked[1], input.weakAreaDetails);
    priorities.push({ rank: 2, title: copy.title, detail: copy.detail });
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
  return applyRoadmapReadinessScoreCeiling(score, assessment, syllabus);
}
