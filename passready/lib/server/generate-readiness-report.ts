import "server-only";

import {
  assessReportNarrativeQuality,
  formatAdiQualityRepairBrief,
  learnerFirstName,
  polishAdiCopy,
} from "@/lib/adi-narrative";
import { WEAK_AREA_OPTIONS } from "@/lib/constants";
import { OFFICIAL_SKILL_GROUPS } from "@/lib/dvsa-ready-to-pass-framework";
import { mapMockTestReflectionSignals } from "@/lib/mock-test-reflection-map";
import {
  aiReadinessNarrativeOnlySchema,
  type AssessmentPayload,
  type AiReadinessNarrativeOnly,
  type DeterministicReadinessResult,
} from "@/lib/validation";
import { createOpenAiJsonCompletion, getOpenAiConfig } from "@/lib/server/openai";
import { isManoeuvreWeakArea } from "@/lib/weak-area-migration";

type GenerateArgs = {
  assessment: AssessmentPayload;
  deterministic: DeterministicReadinessResult;
};

const officialGroupTitles = OFFICIAL_SKILL_GROUPS.map((g) => `- ${g.label}`).join("\n");

const systemPrompt = `You are an experienced UK ADI (Approved Driving Instructor) writing Prep2Pass learner feedback after a lesson or mock assessment. You are not "an AI", never mention models, algorithms, or automation, and never sound like a generic chatbot or American driving school.

Tone: calm, honest, supportive, direct, practical, not patronising. British English only. Write as if speaking to the learner beside the car at the end of a lesson.

Banned phrases (never use): junction work, traffic negotiation, vehicle handling, driver development, roadway, manoeuver, intersection, turn signal, parking lot, road test, behind the wheel, defensive driving programme, operator control.

Use UK terms instead: junctions, emerging, turning left, turning right, observations, mirrors, signals, positioning, planning ahead, meeting traffic, car park, driving test, indicator, manoeuvre, independent driving, following directions, sat nav.

Avoid vague coaching: do not say "improve junctions", "work on observations", or "be more confident" without naming the behaviour. Prefer specifics like "check earlier before emerging", "slow the approach so you have more time to assess the junction", "make mirror checks before changing speed or direction", "avoid rushing the decision when looking for a safe gap", "choose your lane earlier on approach to roundabouts".

Readiness wording (match readinessLabel exactly from the user message):
- Needs More Time: honest but reassuring; build foundations; do not say they are close to test ready.
- Building Consistency: acknowledge progress; unfinished topics; structured practice.
- Nearly Test Ready: consistency, pressure, sharper decisions, mock-test style practice.
- Test Ready: maintain standard, avoid silly mistakes, stay calm, polish.

Mock language: realistic ADI wording. Good: "A mock will be useful once the basics are consistent, because it will show how you cope under pressure." Bad: "A mock is not worth much yet", "simulation pressure scenario".

Test date: if booked, mention naturally, e.g. "With your test on 23 June, the next few lessons should be focused rather than trying to cover everything again."

Lesson hours: never invent numbers. The app adds hour estimates separately. Do not mention "system predicts" or "data suggests".

Punctuation: no Unicode em dash (U+2014) or en dash (U+2013). Use commas, full stops, or hyphen-minus. Hour ranges in prose: "8 to 12 hours".

Safety: no pass guarantees, no unsafe advice, no claiming official DVSA authority. Prep2Pass supports real instructor judgement.

JSON shape (STRICT JSON only):
- readinessScore, readinessLabel, summary, riskAreas, nextSteps, coachMessage
- Set readinessScore and readinessLabel exactly to deterministic baseline values.

**summary** ("Your debrief"):
- One paragraph, about 80-140 words.
- Second person only ("you/your"). Never third person ("Philip has", "the learner is").
- Include: learner first name once; overall readiness judgement tied to readinessLabel; 1-2 clear strengths from assessment data; main thing holding them back; specific driving behaviour to improve; test-date awareness if booked; practical next step.
- Do not narrate entire checklists. Summarise syllabus breadth in one clause; name at most three gaps.
- Do not repeat the coach note.

**coachMessage**: optional one-sentence closing line only (~20-35 words). Must not repeat the debrief. If the debrief is complete, keep coachMessage minimal.

**riskAreas[]**: Prefer you/your. Include every baseline groupKey. Each object: groupKey, groupLabel, severity, skills, summary, optional highlights.

**nextSteps**: 3-8 concrete actions from weak areas, mocks, syllabus gaps, test timing. Match baseline breadth.

Do not include lesson-hour estimates in JSON.`;

async function requestNarrative(userPrompt: string): Promise<AiReadinessNarrativeOnly> {
  const raw = await createOpenAiJsonCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI response was not valid JSON");
  }

  const parsed = aiReadinessNarrativeOnlySchema.safeParse(parsedRaw);
  if (!parsed.success) {
    throw new Error(`OpenAI response failed schema validation: ${parsed.error.message}`);
  }

  return parsed.data;
}

function polishNarrative(narrative: AiReadinessNarrativeOnly): AiReadinessNarrativeOnly {
  return {
    ...narrative,
    summary: polishAdiCopy(narrative.summary),
    coachMessage: polishAdiCopy(narrative.coachMessage),
    nextSteps: narrative.nextSteps.map(polishAdiCopy),
    riskAreas: narrative.riskAreas.map((b) => ({
      ...b,
      summary: polishAdiCopy(b.summary),
      highlights: b.highlights?.map(polishAdiCopy),
    })),
  };
}

async function ensureNarrativeQuality(
  narrative: AiReadinessNarrativeOnly,
  repairContext: string,
): Promise<AiReadinessNarrativeOnly> {
  let current = polishNarrative(narrative);
  let issues = assessReportNarrativeQuality(current);
  if (issues.length === 0) return current;

  const repairPrompt = `${repairContext}\n\n${formatAdiQualityRepairBrief(issues)}\n\nReturn STRICT JSON with keys summary, riskAreas, nextSteps, coachMessage only. Keep riskAreas and nextSteps aligned to the baseline unless a small wording fix is needed.`;

  try {
    const repaired = await requestNarrative(repairPrompt);
    current = polishNarrative({
      ...current,
      summary: repaired.summary,
      coachMessage: repaired.coachMessage,
    });
    issues = assessReportNarrativeQuality(current);
    if (issues.length === 0) return current;
  } catch {
    /* keep polished first pass */
  }

  return current;
}

export async function generateReadinessReport({ assessment, deterministic }: GenerateArgs) {
  const deterministicForPrompt = {
    readinessScore: deterministic.readinessScore,
    readinessLabel: deterministic.readinessLabel,
    riskAreas: deterministic.riskAreas,
    nextSteps: deterministic.nextSteps,
  };

  const reflectionSignals = mapMockTestReflectionSignals(assessment);
  const manoeuvreLabels = assessment.weakAreas
    .filter((id) => isManoeuvreWeakArea(id))
    .map((id) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id);
  const manoeuvrePrompt =
    manoeuvreLabels.length > 0
      ? `\nManoeuvres: include named skill entries for: ${manoeuvreLabels.join("; ")}.\n`
      : "";

  const first = learnerFirstName(assessment.fullName);

  const userPrompt = `Learner first name (use once in summary and once in coachMessage): "${first}"

Assessment data (normalised):
${JSON.stringify(assessment)}
${manoeuvrePrompt}
Deterministic baseline (source of truth for score/label and grouped risk structure). Template summary omitted: write a fresh ADI debrief from this data.
${JSON.stringify(deterministicForPrompt)}

Official skill group titles (use matching groupLabel spelling):
${officialGroupTitles}

Reflection signals for narrative enrichment (DO NOT alter score/label):
${JSON.stringify(reflectionSignals)}

Reflection usage:
1) Prioritise categorySignals over extractedKeywords.
2) Use reinforcedGroups to sharpen risk-area summaries.
3) Use coachToneHints and coachNoteHints to shape coachMessage tone and specificity.
4) Use nextStepHints to make nextSteps concrete.
5) If reflection signals are empty, use deterministic + weak areas only.

Test date (when testBooked is "yes" and testDate set):
1) Work backwards from the date in summary, coachMessage, and nextSteps where helpful.
2) Mention the booked date naturally.

Mock and fault rules:
1) If mockTestTaken is "no", do NOT mention serious or driving fault counts (including zero).
2) Only reference fault counts when mockTestTaken is "yes" or non-zero lesson fault counts were entered.

Constraints:
1) Preserve readinessScore exactly as ${deterministic.readinessScore}.
2) Preserve readinessLabel exactly as "${deterministic.readinessLabel}".
3) Include every baseline groupKey from deterministic.riskAreas.
4) summary: ADI debrief paragraph (80-140 words), specific behaviours, UK vocabulary.
5) coachMessage: shorter closing paragraph (60-90 words), distinct from summary.
6) Never mention AI, chatbots, or language models.
7) Mirror deterministic nextSteps themes.
8) Return JSON only.`;

  const parsed = await requestNarrative(userPrompt);
  const enriched = await ensureNarrativeQuality(parsed, userPrompt);

  return {
    ...enriched,
    readinessScore: deterministic.readinessScore,
    readinessLabel: deterministic.readinessLabel,
    recommendedHours: deterministic.recommendedHours,
    model: getOpenAiConfig().model,
  };
}
