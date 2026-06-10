import {
  learnerFirstName,
  primaryWeakAreaBehaviour,
  readinessVerdictPhrase,
  weakAreaLabels,
} from "@/lib/adi-narrative";
import { pickCopyVariant, reportCopySalt } from "@/lib/deterministic-report-copy";
import { formatIsoDateUk } from "@/lib/formatting";
import { buildSyllabusProgressSnapshot } from "@/lib/syllabus-coverage";
import { syllabusTopicLabel } from "@/lib/syllabus-topics";
import type { AssessmentPayload, DeterministicReadinessResult } from "@/lib/validation";

function coveredTopicPhrase(assessment: AssessmentPayload, salt: number): string | null {
  const covered = assessment.topicsCovered ?? [];
  if (covered.length < 3) return null;
  const labels = covered.slice(0, 4).map((id) => syllabusTopicLabel(id).toLowerCase());
  const joined =
    labels.length >= 3
      ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
      : labels.join(" and ");
  return pickCopyVariant(salt, "fb:topics", [
    `You have covered a useful range already, including ${joined}.`,
    `Your recent practice includes ${joined}, which gives you a solid base to build on.`,
  ]);
}

function strengthClause(assessment: AssessmentPayload, salt: number): string {
  const topics = coveredTopicPhrase(assessment, salt);
  if (topics) return topics;
  if (assessment.weakAreas.length === 0) {
    return pickCopyVariant(salt, "fb:str:none", [
      "Your self-reported weak areas are limited, which suggests reasonable consistency on familiar routes.",
      "You are not flagging many weak areas, so your basics may already be fairly steady on routes you know.",
    ]);
  }
  if (assessment.confidenceLevel >= 7) {
    return pickCopyVariant(salt, "fb:str:conf", [
      "Your confidence is high, which helps when you stay focused on observations and decisions.",
      "You sound confident in the car, and that is positive when it stays tied to good observations.",
    ]);
  }
  return pickCopyVariant(salt, "fb:str:base", [
    "You are building useful routines, and your instructor can see progress when lessons stay focused.",
    "There are clear strengths in your control and planning when the drive stays structured.",
  ]);
}

function holdingBackClause(assessment: AssessmentPayload, salt: number): string {
  const labels = weakAreaLabels(assessment.weakAreas);
  const behaviour = primaryWeakAreaBehaviour(assessment.weakAreas);
  if (labels.length === 0) {
    return pickCopyVariant(salt, "fb:hold:none", [
      `The main focus now is consistency under pressure, especially ${behaviour}.`,
      `What will move the score next is sharper decisions on the road: ${behaviour}.`,
    ]);
  }
  const focus = labels.slice(0, 2).join(" and ");
  return pickCopyVariant(salt, "fb:hold", [
    `The main thing holding you back now is ${focus.toLowerCase()}, especially when you need to ${behaviour}.`,
    `Your biggest gap is ${focus.toLowerCase()}. The behaviour to tighten is to ${behaviour}.`,
  ]);
}

function testDateClause(assessment: AssessmentPayload, salt: number): string {
  if (assessment.testBooked !== "yes" || !assessment.testDate) return "";
  const date = formatIsoDateUk(assessment.testDate);
  return pickCopyVariant(salt, "fb:test", [
    ` With your test on ${date}, work backwards: tackle weaker areas first, then use the final lessons to polish and maintain standard.`,
    ` Before your ${date} test, keep lessons focused rather than trying to cover everything again.`,
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

function nextStepClause(assessment: AssessmentPayload, salt: number): string {
  const primary = assessment.weakAreas[0];
  const behaviour = primaryWeakAreaBehaviour(assessment.weakAreas);
  if (primary) {
    const label = weakAreaLabels([primary])[0]?.toLowerCase() ?? "your main weak area";
    return pickCopyVariant(salt, "fb:next", [
      `Next lesson, agree one target with your instructor on ${label}: ${behaviour}.`,
      `For the next drive, focus on ${label} and practise until you can ${behaviour}.`,
    ]);
  }
  return pickCopyVariant(salt, "fb:nextGen", [
    "Next lesson, agree one observable target with your instructor and repeat it on two familiar routes.",
    "Pick one routine to polish next time, then revisit it on a slightly busier road.",
  ]);
}

function hoursClause(deterministic: DeterministicReadinessResult, salt: number): string {
  const h = deterministic.estimatedLessonHours;
  if (!h) return "";
  const band = h.openEndedHigh ? `${h.min}+ hours` : `${h.min} to ${h.max} hours`;
  return pickCopyVariant(salt, "fb:hours", [
    ` You are likely looking at around ${band} more if the next lessons stay focused.`,
    ` That could sit around ${band} more with your instructor if practice stays targeted.`,
  ]);
}

export function buildFallbackDebrief(
  assessment: AssessmentPayload,
  deterministic: DeterministicReadinessResult,
): string {
  const salt = reportCopySalt(assessment);
  const first = learnerFirstName(assessment.fullName);
  const verdict = readinessVerdictPhrase(deterministic.readinessLabel);
  const snap = buildSyllabusProgressSnapshot(assessment);
  const syllabusNote =
    snap && snap.uncoveredPriorityLabels.length > 0
      ? pickCopyVariant(salt, "fb:syll", [
          ` You still have syllabus topics to cover, including ${snap.uncoveredPriorityLabels.slice(0, 2).join(" and ").toLowerCase()}.`,
          ` Keep building breadth on ${snap.uncoveredPriorityLabels.slice(0, 2).join(" and ").toLowerCase()} alongside your weak areas.`,
        ])
      : "";

  return polishFallbackParagraph(
    `${first}, ${verdict}. ${strengthClause(assessment, salt)} ${holdingBackClause(assessment, salt)}${syllabusNote}${mockClause(assessment, salt)}${testDateClause(assessment, salt)}${hoursClause(deterministic, salt)} ${nextStepClause(assessment, salt)}`,
  );
}

export function buildFallbackCoachMessage(
  assessment: AssessmentPayload,
  deterministic: DeterministicReadinessResult,
): string {
  const salt = reportCopySalt(assessment);
  const first = learnerFirstName(assessment.fullName);
  const behaviour = primaryWeakAreaBehaviour(assessment.weakAreas);
  const focus = weakAreaLabels(assessment.weakAreas)[0]?.toLowerCase() ?? "your main focus area";

  const byLabel: Record<DeterministicReadinessResult["readinessLabel"], string[]> = {
    "Needs More Time": [
      `${first}, keep the next few lessons simple and repeat the basics until they feel boring. Agree one small target with your instructor each time, then add one new road type when that target is steady.`,
      `${first}, you do not need to rush the test date. Build one routine at a time with your instructor and notice when it feels automatic before stretching onto harder junctions.`,
    ],
    "Building Consistency": [
      `${first}, you are moving in the right direction. Next lesson, pick ${focus} and work on one behaviour: ${behaviour}. Repeat it on familiar roads before you add pressure.`,
      `${first}, progress shows when lessons stay structured. With your instructor, agree one clear target on ${focus} and practise until the decision feels calm, not rushed.`,
    ],
    "Nearly Test Ready": [
      `${first}, you are close now, so consistency matters more than new topics. Next drive, focus on ${focus} and ${behaviour}, then build in mock-test style routes nearer your test.`,
      `${first}, polish the edges that still wobble. ${focus} is the priority: ${behaviour}. Stay disciplined on easier routes too so good habits do not slip under pressure.`,
    ],
    "Test Ready": [
      `${first}, maintain the standard you already show on good drives. Next lesson, rehearse one pressure moment on ${focus} and ${behaviour}, then keep mock-test style practice calm and tidy.`,
      `${first}, avoid silly mistakes by staying structured even on easy routes. Agree one final polish target with your instructor on ${focus}: ${behaviour}.`,
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
