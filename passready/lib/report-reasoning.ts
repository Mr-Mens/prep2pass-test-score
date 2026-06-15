import { WEAK_AREA_OPTIONS, type WeakAreaId } from "@/lib/constants";
import { MOCK_REFLECTION_SUB_OPTIONS } from "@/lib/mock-reflection";
import { isManoeuvreWeakArea } from "@/lib/product-skill-map";
import { syllabusLayerActive } from "@/lib/syllabus-coverage";
import type { AssessmentPayload, SyllabusProgressSnapshot, WeakAreaDetailEntry } from "@/lib/validation";
import {
  labelForFollowUpSubtopic,
  type WeakAreaFollowUpCategoryId,
  type WeakAreaFollowUpSubtopicId,
} from "@/lib/weak-area-follow-up";

export type RiskEvidenceSource =
  | "learner_detail"
  | "learner_broad"
  | "mock_evidence"
  | "syllabus_gap"
  | "confidence"
  | "inference";

export type FaithfulRiskCopy = {
  faultArea: string;
  whyItMatters: string;
  practiceNext: string;
  source: RiskEvidenceSource;
};

export function weakAreaIdToFollowUpCategory(id: WeakAreaId): WeakAreaFollowUpCategoryId | null {
  if (id === "junctions") return "junctions";
  if (id === "roundabouts") return "roundabouts";
  if (isManoeuvreWeakArea(id)) return "manoeuvres";
  if (id === "independentDriving") return "independentDriving";
  if (id === "dualCarriageways") return "dualCarriageways";
  return null;
}

export function detailForWeakArea(
  details: WeakAreaDetailEntry[] | undefined,
  weakAreaId: WeakAreaId,
): WeakAreaDetailEntry | undefined {
  const category = weakAreaIdToFollowUpCategory(weakAreaId);
  if (!category) return undefined;
  return details?.find((d) => d.category === category);
}

export function hasSpecificLearnerDetail(entry?: WeakAreaDetailEntry): boolean {
  if (!entry) return false;
  const meaningful = entry.subtopics.filter((id) => labelForFollowUpSubtopic(id) !== "Not sure");
  return meaningful.length > 0 || Boolean(entry.notes?.trim());
}

function weakAreaLabel(id: WeakAreaId): string {
  return WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function subtopicLabels(entry: WeakAreaDetailEntry): string[] {
  return entry.subtopics
    .map((id) => labelForFollowUpSubtopic(id))
    .filter((l) => l !== "Not sure");
}

function hasSubtopic(entry: WeakAreaDetailEntry | undefined, id: WeakAreaFollowUpSubtopicId): boolean {
  return Boolean(entry?.subtopics.includes(id));
}

function notesMention(entry: WeakAreaDetailEntry | undefined, word: string): boolean {
  return Boolean(entry?.notes?.trim().toLowerCase().includes(word));
}

function broadWeakAreaRiskCopy(weakAreaId: WeakAreaId): FaithfulRiskCopy {
  const label = weakAreaLabel(weakAreaId).toLowerCase();
  return {
    faultArea: `${weakAreaLabel(weakAreaId)} consistency`,
    whyItMatters: `The assessment suggests ${label} are currently your weakest area. The exact cause may be observations, positioning, speed, hesitation or decision-making, which your instructor can confirm on the road.`,
    practiceNext: `Use your next lesson to identify the main cause with your instructor before drilling one type at a time.`,
    source: "learner_broad",
  };
}

function buildJunctionRiskCopy(entry?: WeakAreaDetailEntry): FaithfulRiskCopy {
  if (!hasSpecificLearnerDetail(entry)) {
    return {
      faultArea: "Junction consistency",
      whyItMatters:
        "Junctions can lead to faults if the cause is not clear, such as observations, positioning, speed, hesitation or decision-making.",
      practiceNext:
        "Use your next lesson to identify the exact cause with your instructor before drilling one junction type at a time.",
      source: "learner_broad",
    };
  }

  const hasRight = hasSubtopic(entry, "junctions_turning_right");
  const hasPositioning =
    hasSubtopic(entry, "junctions_positioning") || notesMention(entry, "position");
  const hasObservations = hasSubtopic(entry, "junctions_observations");
  const hasEmerging = hasSubtopic(entry, "junctions_emerging");
  const hasGaps = hasSubtopic(entry, "junctions_judging_gaps");
  const hasApproachSpeed = hasSubtopic(entry, "junctions_approach_speed");

  if (hasRight && hasPositioning) {
    return {
      faultArea: "Turning right positioning",
      whyItMatters:
        "Choosing your position early helps other road users understand your intentions and gives you more time to assess the junction safely.",
      practiceNext:
        "Practise approaching right turns slowly enough to position early, signal clearly, and hold your position before committing.",
      source: "learner_detail",
    };
  }

  if (hasObservations) {
    return {
      faultArea: "Junction observations",
      whyItMatters:
        "You reported difficulty with observations at junctions. Late or incomplete checks can affect when you commit safely.",
      practiceNext:
        "Slow the approach, take effective observations both ways, and only commit when the gap is clearly safe.",
      source: "learner_detail",
    };
  }

  if (hasEmerging) {
    return {
      faultArea: "Emerging at junctions",
      whyItMatters:
        "You reported difficulty emerging into traffic. This may affect gap judgement and decision timing under pressure.",
      practiceNext:
        "Practise emerging in stages: slow the approach, observe both ways, and commit only when the gap is clearly safe.",
      source: "learner_detail",
    };
  }

  if (hasGaps) {
    return {
      faultArea: "Junction gap judgement",
      whyItMatters:
        "You reported difficulty judging safe gaps at junctions. Rushed or hesitant decisions often show up under test pressure.",
      practiceNext:
        "Work with your instructor on a small range of junctions, focusing on when to wait and when the gap is clearly safe.",
      source: "learner_detail",
    };
  }

  if (hasApproachSpeed) {
    return {
      faultArea: "Junction approach speed",
      whyItMatters:
        "You reported difficulty with approach speed at junctions. Arriving too fast or too hesitant can unsettle observations and positioning.",
      practiceNext:
        "Slow earlier on approach so you have more time to observe, position, and decide calmly.",
      source: "learner_detail",
    };
  }

  const labels = subtopicLabels(entry!);
  if (labels.length) {
    const focus = labels.slice(0, 2).join(" and ").toLowerCase();
    return {
      faultArea: labels.length === 1 ? labels[0]! : `Junction ${focus}`,
      whyItMatters: `You reported difficulty with ${focus} at junctions. This may affect how safely you can commit at decision points.`,
      practiceNext: `Work with your instructor on ${focus} at a small range of junction types before adding traffic pressure.`,
      source: "learner_detail",
    };
  }

  return {
    faultArea: "Junction consistency",
    whyItMatters: `You noted: "${entry!.notes!.trim()}". Work with your instructor to confirm how this shows up on the road.`,
    practiceNext: "Agree one observable junction target for your next lesson and repeat it on familiar routes first.",
    source: "learner_detail",
  };
}

function buildRoundaboutRiskCopy(entry?: WeakAreaDetailEntry): FaithfulRiskCopy {
  if (!hasSpecificLearnerDetail(entry)) {
    return {
      faultArea: "Roundabout consistency",
      whyItMatters:
        "Roundabouts can lead to faults if lane choice, observations, positioning or exit timing are not yet steady.",
      practiceNext:
        "Use your next lesson to identify the main roundabout difficulty with your instructor before adding multi-lane pressure.",
      source: "learner_broad",
    };
  }

  const labels = subtopicLabels(entry!);
  const focus = labels.slice(0, 2).join(" and ").toLowerCase();
  return {
    faultArea: labels.length === 1 ? `Roundabout ${labels[0]!.toLowerCase()}` : `Roundabout ${focus}`,
    whyItMatters: `You reported difficulty with ${focus} at roundabouts. This may affect how calmly you can enter, hold lane discipline and exit safely.`,
    practiceNext: `Practise ${focus} at lower-traffic roundabouts first, then build pressure gradually with your instructor.`,
    source: "learner_detail",
  };
}

function buildManoeuvreRiskCopy(entry?: WeakAreaDetailEntry): FaithfulRiskCopy {
  if (!hasSpecificLearnerDetail(entry)) {
    return {
      faultArea: "Manoeuvre consistency",
      whyItMatters:
        "Manoeuvres can lead to faults if control, observations or positioning are not yet steady through the full move.",
      practiceNext:
        "Use your next lesson to identify which manoeuvre needs the most work before drilling accuracy under pressure.",
      source: "learner_broad",
    };
  }

  const labels = subtopicLabels(entry!);
  const focus = labels.slice(0, 2).join(" and ").toLowerCase();
  return {
    faultArea: labels.length === 1 ? labels[0]! : `Manoeuvre ${focus}`,
    whyItMatters: `You reported difficulty with ${focus} during manoeuvres. Examiners look for control and observations through the full move.`,
    practiceNext: `Keep the manoeuvre slow, with observations through the full move, focusing on ${focus}.`,
    source: "learner_detail",
  };
}

export function buildFaithfulWeakAreaRiskCopy(
  weakAreaId: WeakAreaId,
  details: WeakAreaDetailEntry[] | undefined,
): FaithfulRiskCopy {
  const entry = detailForWeakArea(details, weakAreaId);

  if (weakAreaId === "junctions") return buildJunctionRiskCopy(entry);
  if (weakAreaId === "roundabouts") return buildRoundaboutRiskCopy(entry);
  if (isManoeuvreWeakArea(weakAreaId)) return buildManoeuvreRiskCopy(detailForWeakArea(details, weakAreaId));

  if (!hasSpecificLearnerDetail(entry)) {
    return broadWeakAreaRiskCopy(weakAreaId);
  }

  const labels = subtopicLabels(entry!);
  const focus = labels.slice(0, 2).join(" and ").toLowerCase();
  const area = weakAreaLabel(weakAreaId).toLowerCase();
  return {
    faultArea: labels.length === 1 ? labels[0]! : `${weakAreaLabel(weakAreaId)}: ${labels.slice(0, 2).join(" and ")}`,
    whyItMatters: `You reported difficulty with ${focus || area}. This may be affecting your consistency under pressure.`,
    practiceNext: `Work with your instructor on ${focus || area} in short, repeated practice before adding busier roads.`,
    source: "learner_detail",
  };
}

export function buildFaithfulPriorityCopy(
  weakAreaId: WeakAreaId,
  details: WeakAreaDetailEntry[] | undefined,
): { title: string; detail: string } {
  const entry = detailForWeakArea(details, weakAreaId);
  const label = weakAreaLabel(weakAreaId).toLowerCase();

  if (weakAreaId === "junctions") {
    const hasRight = hasSubtopic(entry, "junctions_turning_right");
    const hasPositioning =
      hasSubtopic(entry, "junctions_positioning") || notesMention(entry, "position");
    if (hasRight && hasPositioning) {
      return {
        title: "Improve right-turn positioning",
        detail:
          "Slow the approach, choose the correct position earlier, and hold it consistently before turning right.",
      };
    }
  }

  if (!hasSpecificLearnerDetail(entry)) {
    return {
      title: `Clarify ${label} difficulties`,
      detail: `The assessment suggests ${label} are currently your weakest area. Work with your instructor to identify whether observations, positioning, speed or decision-making are causing the most difficulty.`,
    };
  }

  const labels = subtopicLabels(entry!);
  const focus = labels.slice(0, 2).join(" and ").toLowerCase();
  return {
    title: `Improve ${focus || label}`,
    detail: `You reported ${focus || label} as a difficulty. Focus your next lesson on this with your instructor before adding test-style pressure.`,
  };
}

export function manoeuvreGapSeverity(
  assessment: AssessmentPayload,
  syllabus: SyllabusProgressSnapshot | null | undefined,
): "none" | "moderate" | "severe" {
  const manoeuvreWeak = assessment.weakAreas.some((id) => isManoeuvreWeakArea(id));
  if (!syllabusLayerActive(assessment)) {
    return manoeuvreWeak ? "moderate" : "none";
  }
  const cat = syllabus?.categoryProgress.find((c) => c.key === "manoeuvres");
  if (!cat) return manoeuvreWeak ? "moderate" : "none";
  if (cat.covered <= 2) return "severe";
  if (cat.covered < cat.total || manoeuvreWeak) return "moderate";
  return "none";
}

export function applySyllabusCriticalGapPenalties(
  score: number,
  assessment: AssessmentPayload,
  syllabus: SyllabusProgressSnapshot | null | undefined,
): number {
  if (!syllabusLayerActive(assessment) || !syllabus) return score;

  let adjusted = score;
  const ind = syllabus.categoryProgress.find((c) => c.key === "independent_driving");
  const man = syllabus.categoryProgress.find((c) => c.key === "manoeuvres");

  if (ind && ind.covered === 0) adjusted -= 10;
  else if (ind && ind.completionPercent < 50) adjusted -= 4;

  if (man && man.covered <= 2) adjusted -= 8;
  else if (man && man.completionPercent < 50) adjusted -= 3;

  if (ind && ind.covered === 0 && man && man.covered <= 2) adjusted -= 4;

  return Math.max(0, Math.min(100, Math.round(adjusted)));
}

export function applyReadinessBandCeilings(
  score: number,
  assessment: AssessmentPayload,
  syllabus: SyllabusProgressSnapshot | null | undefined,
  indGap: "none" | "moderate" | "severe",
  manGap: "none" | "moderate" | "severe",
): number {
  const strongEvidence =
    assessment.mockTestTaken === "yes" &&
    assessment.mockTestResult === "pass" &&
    assessment.lessonsTaken >= 25;

  let capped = score;

  if (indGap === "severe") {
    capped = Math.min(capped, strongEvidence ? 74 : 64);
  } else if (indGap === "moderate") {
    capped = Math.min(capped, 74);
  }

  if (manGap === "severe") {
    capped = Math.min(capped, strongEvidence ? 74 : 69);
  } else if (manGap === "moderate") {
    capped = Math.min(capped, 74);
  }

  if (indGap === "severe" && manGap !== "none") {
    capped = Math.min(capped, strongEvidence ? 64 : 59);
  }

  return capped;
}

export function categoryRoadmapGapLabel(key: string, covered: number, total: number): string | null {
  if (covered === 0 && total > 0) return "Major gap before test readiness";
  if (total > 0 && covered <= Math.ceil(total * 0.4)) return "Partially covered, needs more practice";
  return null;
}

export function testRisksSourceCaption(mockTestTaken: AssessmentPayload["mockTestTaken"]): string {
  if (mockTestTaken === "yes") {
    return "Based on your selected weak areas, roadmap gaps and mock-test result.";
  }
  return "Based on your selected weak areas and roadmap gaps.";
}

const MOCK_DETAIL_RISK_COPY: Partial<
  Record<
    string,
    Pick<FaithfulRiskCopy, "faultArea" | "whyItMatters" | "practiceNext">
  >
> = {
  junctions_poor_observation: {
    faultArea: "Junction observations",
    whyItMatters:
      "Your mock-test reflection flagged junction observations. Late or incomplete checks can affect when you commit safely.",
    practiceNext:
      "Slow the approach, take effective observations both ways, and only commit when the gap is clearly safe.",
  },
  junctions_turn_timing: {
    faultArea: "Junction timing",
    whyItMatters:
      "Your mock-test reflection flagged turning too early or late at junctions, which can affect positioning and safety.",
    practiceNext:
      "Practise slowing the approach so you have time to position, observe and commit at the right moment.",
  },
  junctions_approach_too_fast: {
    faultArea: "Junction approach speed",
    whyItMatters:
      "Your mock-test reflection flagged approaching junctions too fast, which reduces time to observe and decide.",
    practiceNext: "Slow earlier on approach so observations and positioning stay calm and controlled.",
  },
};

export function mockReflectionRiskItems(assessment: AssessmentPayload): Array<
  FaithfulRiskCopy & { id: string; severity: "high" | "moderate" }
> {
  if (assessment.mockTestTaken !== "yes") return [];

  const items: Array<FaithfulRiskCopy & { id: string; severity: "high" | "moderate" }> = [];
  const seen = new Set<string>();

  for (const detailId of assessment.mockReflectionDetails ?? []) {
    const copy = MOCK_DETAIL_RISK_COPY[detailId];
    if (!copy || seen.has(detailId)) continue;
    seen.add(detailId);
    const option = MOCK_REFLECTION_SUB_OPTIONS.find((o) => o.id === detailId);
    items.push({
      id: `mock_${detailId}`,
      ...copy,
      source: "mock_evidence",
      severity: "high",
    });
    void option;
  }

  return items;
}

export function buildFaithfulHoldingBackClause(
  assessment: AssessmentPayload,
  details: WeakAreaDetailEntry[] | undefined,
): string {
  const ranked = assessment.weakAreas;
  if (ranked.length === 0) {
    return "The main focus now is consistency under pressure on familiar routes before stretching onto harder roads.";
  }

  const primary = ranked[0]!;
  const entry = detailForWeakArea(details, primary);
  const label = weakAreaLabel(primary).toLowerCase();

  if (primary === "junctions") {
    const hasRight = hasSubtopic(entry, "junctions_turning_right");
    const hasPositioning =
      hasSubtopic(entry, "junctions_positioning") || notesMention(entry, "position");
    if (hasRight && hasPositioning) {
      return "The main issue you identified is junctions, particularly turning right and knowing where to position.";
    }
  }

  if (!hasSpecificLearnerDetail(entry)) {
    return `The assessment suggests ${label} are currently your weakest area. Work with your instructor to identify whether observations, positioning, speed or decision-making are causing the most difficulty.`;
  }

  const labels = subtopicLabels(entry!);
  const focus = labels.slice(0, 2).join(" and ").toLowerCase();
  return `The main issue you identified is ${label}, particularly ${focus}.`;
}

export function buildFaithfulNextStepClause(
  assessment: AssessmentPayload,
  details: WeakAreaDetailEntry[] | undefined,
): string {
  const primary = assessment.weakAreas[0];
  if (!primary) {
    return "Next lesson, agree one observable target with your instructor and repeat it on two familiar routes.";
  }

  const copy = buildFaithfulPriorityCopy(primary, details);
  return `${copy.detail} Take this as your focus for the next session.`;
}

export function evidenceBasedStrengthClause(assessment: AssessmentPayload): string | null {
  const covered = assessment.topicsCovered ?? [];
  const weakCount = assessment.weakAreas.length;
  const mockPass = assessment.mockTestTaken === "yes" && assessment.mockTestResult === "pass";
  const lowFaults =
    assessment.mockTestTaken === "yes" &&
    assessment.seriousFaults === 0 &&
    assessment.drivingFaults <= 6;
  const mirrorsNotWeak = !assessment.weakAreas.includes("mirrors");
  const planningNotWeak = !assessment.weakAreas.some((id) =>
    ["junctions", "roundabouts", "independentDriving"].includes(id),
  );

  if (mockPass && lowFaults && mirrorsNotWeak && planningNotWeak) {
    return "Your mock pass and fault pattern suggest reasonable consistency on familiar routes when you stay structured.";
  }

  if (covered.length >= 8 && weakCount <= 2 && assessment.confidenceLevel >= 6) {
    return "You have covered a broad spread of the syllabus and your confidence appears to be in a good place.";
  }

  if (covered.length >= 5 && weakCount <= 3) {
    return "You have covered several important areas and are building a useful base.";
  }

  if (assessment.confidenceLevel >= 7 && weakCount <= 2) {
    return "Your confidence appears to be in a good place, which helps when lessons stay focused on one target at a time.";
  }

  if (covered.length >= 3) {
    return "You have started building breadth across the syllabus, which gives your instructor something solid to work from.";
  }

  return null;
}
