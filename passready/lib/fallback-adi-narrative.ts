import {
  learnerFirstName,
  weakAreaLabels,
} from "@/lib/adi-narrative";
import { pickCopyVariant, reportCopySalt } from "@/lib/deterministic-report-copy";
import { formatIsoDateUk } from "@/lib/formatting";
import {
  buildFaithfulHoldingBackClause,
  buildFaithfulNextStepClause,
  buildFaithfulPriorityCopy,
  evidenceBasedStrengthClause,
} from "@/lib/report-reasoning";
import { readinessVerdictForScore } from "@/lib/readiness-calibration";
import { buildSyllabusProgressSnapshot } from "@/lib/syllabus-coverage";
import type { AssessmentPayload, DeterministicReadinessResult } from "@/lib/validation";

function syllabusGapClause(assessment: AssessmentPayload, salt: number): string {
  const snap = buildSyllabusProgressSnapshot(assessment);
  if (!snap) return "";

  const ind = snap.categoryProgress.find((c) => c.key === "independent_driving");
  const man = snap.categoryProgress.find((c) => c.key === "manoeuvres");
  const parts: string[] = [];

  if (ind && ind.covered === 0) {
    parts.push("independent driving");
  }
  if (man && man.covered <= 2) {
    parts.push("some manoeuvres");
  }

  if (parts.length === 0 && snap.uncoveredPriorityLabels.length > 0) {
    return pickCopyVariant(salt, "fb:syll", [
      ` You still have syllabus topics to cover, including ${snap.uncoveredPriorityLabels.slice(0, 2).join(" and ").toLowerCase()}.`,
      ` Keep building breadth on ${snap.uncoveredPriorityLabels.slice(0, 2).join(" and ").toLowerCase()} alongside your weak areas.`,
    ]);
  }

  if (parts.length === 0) return "";

  const joined = parts.join(" and ");
  return pickCopyVariant(salt, "fb:syllGap", [
    ` ${joined.charAt(0).toUpperCase()}${joined.slice(1)} also still need building into normal lessons, so the next few sessions should prioritise those gaps before moving into full mock-test style drives.`,
    ` ${joined.charAt(0).toUpperCase()}${joined.slice(1)} are still major roadmap gaps, so build them into normal lessons before adding test-style pressure.`,
  ]);
}

function testDateClause(assessment: AssessmentPayload, salt: number): string {
  if (assessment.testBooked !== "yes" || !assessment.testDate) return "";
  const date = formatIsoDateUk(assessment.testDate);
  return pickCopyVariant(salt, "fb:test", [
    ` Before your ${date} test, keep lessons focused rather than trying to cover everything again.`,
    ` With your test on ${date}, work backwards: tackle weaker areas first, then use the final lessons to maintain standard.`,
  ]);
}

function mockClause(assessment: AssessmentPayload, salt: number): string {
  if (assessment.mockTestTaken === "yes") {
    if (assessment.mockTestResult === "fail") {
      return pickCopyVariant(salt, "fb:mockFail", [
        " Your mock did not pass, so treat the fault themes as a checklist with your instructor.",
        " Use the mock fail as useful data: repeat the corrections on the routes that caught you out.",
      ]);
    }
    if (assessment.mockTestResult === "pass") {
      return pickCopyVariant(salt, "fb:mockPass", [
        " Your mock pass is encouraging, but keep mock-test style drives going so pressure does not slip.",
        " A mock pass is a good sign; now keep the same standard on busier routes.",
      ]);
    }
    return "";
  }
  return pickCopyVariant(salt, "fb:mockNo", [
    " A mock will be useful once the basics are consistent, because it shows how you cope under pressure.",
    " Book a mock with your instructor when the core routines are steady, not before.",
  ]);
}

function strengthClause(assessment: AssessmentPayload, salt: number): string {
  const evidence = evidenceBasedStrengthClause(assessment);
  if (evidence) return evidence;
  return pickCopyVariant(salt, "fb:str:safe", [
    "You have useful lesson experience to build on, and the next step is to make your routines more consistent under light pressure.",
    "There is progress to build from, and the priority now is turning lesson work into steady habits on the road.",
  ]);
}

function trimToWordRange(text: string, minWords: number, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ").replace(/\s+([,.])/g, "$1")}.`;
}

export function buildFallbackDebrief(
  assessment: AssessmentPayload,
  deterministic: DeterministicReadinessResult,
): string {
  const salt = reportCopySalt(assessment);
  const first = learnerFirstName(assessment.fullName);
  const verdict = readinessVerdictForScore(deterministic.readinessLabel, deterministic.readinessScore);
  const details = assessment.weakAreaDetails ?? [];

  const paragraph = trimToWordRange(
    `${first}, ${verdict}. ${strengthClause(assessment, salt)} ${buildFaithfulHoldingBackClause(assessment, details)}${syllabusGapClause(assessment, salt)}${mockClause(assessment, salt)}${testDateClause(assessment, salt)} ${buildFaithfulNextStepClause(assessment, details)}`,
    80,
    140,
  );

  return polishFallbackParagraph(paragraph);
}

export function buildFallbackCoachMessage(
  assessment: AssessmentPayload,
  deterministic: DeterministicReadinessResult,
): string {
  const salt = reportCopySalt(assessment);
  const first = learnerFirstName(assessment.fullName);
  const primary = assessment.weakAreas[0];
  const copy = primary
    ? buildFaithfulPriorityCopy(primary, assessment.weakAreaDetails)
    : null;
  const focus = weakAreaLabels(assessment.weakAreas)[0]?.toLowerCase() ?? "your main focus area";

  const byLabel: Record<DeterministicReadinessResult["readinessLabel"], string[]> = {
    "Needs More Time": [
      `${first}, keep the next few lessons simple and repeat the basics until they feel boring. Agree one small target with your instructor each time, then add one new road type when that target is steady.`,
      `${first}, you do not need to rush the test date. Build one routine at a time with your instructor and notice when it feels automatic before stretching onto harder junctions.`,
    ],
    "Building Consistency": [
      copy
        ? `${first}, you are moving in the right direction. ${copy.detail}`
        : `${first}, you are moving in the right direction. Next lesson, pick ${focus} and work on one clear behaviour with your instructor before adding pressure.`,
      `${first}, progress shows when lessons stay structured. Agree one clear target on ${focus} and practise until the decision feels calm, not rushed.`,
    ],
    "Nearly Test Ready": [
      copy
        ? `${first}, you are close now, so consistency matters more than new topics. ${copy.detail}`
        : `${first}, you are close now, so consistency matters more than new topics. Next drive, focus on ${focus}, then build in mock-test style routes nearer your test.`,
      `${first}, polish the edges that still wobble. ${copy?.title ?? focus} is the priority. Stay disciplined on easier routes too so good habits do not slip under pressure.`,
    ],
    "Test Ready": [
      copy
        ? `${first}, maintain the standard you already show on good drives. ${copy.detail}`
        : `${first}, maintain the standard you already show on good drives. Next lesson, rehearse one pressure moment on ${focus}, then keep mock-test style practice calm and tidy.`,
      `${first}, avoid silly mistakes by staying structured even on easy routes. Agree one final polish target with your instructor on ${focus}.`,
    ],
  };

  const variants = byLabel[deterministic.readinessLabel];
  let msg = pickCopyVariant(salt, `coach:${deterministic.readinessLabel}`, variants as [string, ...string[]]);

  if (assessment.testBooked === "yes" && assessment.testDate) {
    msg += pickCopyVariant(salt, "coach:test", [
      ` With your test on ${formatIsoDateUk(assessment.testDate)}, keep the plan focused rather than spreading practice too thin.`,
      ` Work backwards from ${formatIsoDateUk(assessment.testDate)}: weaker areas first, then lighter confidence drives near the day.`,
    ]);
  }

  return polishFallbackParagraph(msg);
}

function polishFallbackParagraph(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();
}
