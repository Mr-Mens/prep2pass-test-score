import "server-only";

import { WEAK_AREA_OPTIONS } from "@/lib/constants";
import { OFFICIAL_SKILL_GROUPS } from "@/lib/dvsa-ready-to-pass-framework";
import { mapMockTestReflectionSignals } from "@/lib/mock-test-reflection-map";
import {
  aiReadinessReportSchema,
  type AssessmentPayload,
  type DeterministicReadinessResult,
} from "@/lib/validation";
import { createOpenAiJsonCompletion, getOpenAiConfig } from "@/lib/server/openai";
import { isManoeuvreWeakArea } from "@/lib/weak-area-migration";

type GenerateArgs = {
  assessment: AssessmentPayload;
  deterministic: DeterministicReadinessResult;
};

const officialGroupTitles = OFFICIAL_SKILL_GROUPS.map((g) => `- ${g.label}`).join("\n");

const systemPrompt = `You are an experienced UK driving instructor writing concise readiness guidance.
Rules:
- Safety-first and practical.
- No hype, no fluff, no vague motivational language.
- Do not claim DVSA authority or official DVSA affiliation.
- Do not state that this score is an official DVSA score or product.
- Do not guarantee pass/fail outcomes.
- Do not provide unsafe, illegal, or non-compliant advice.
- Keep language clear for learner drivers.
- Return STRICT JSON only with keys:
  readinessScore, readinessLabel, summary, riskAreas, nextSteps, recommendedHours, coachMessage
- riskAreas: array of 2-6 objects. Each object MUST have:
  "groupKey" (string — snake_case key, one of: basics, control_and_positioning, observation_signalling_planning, junctions_roundabouts_crossings, manoeuvres, road_types, driving_conditions, following_routes),
  "groupLabel" (string — human title matching that key from the user message list),
  "severity" ("high" | "moderate" | "low"),
  "skills" (array of 0-8 objects, each with: "key" product id e.g. mirrors, "label" short learner label, "officialSkillId" number 1-27, "officialSkillName" full skill name from framework),
  "summary" (one short paragraph for that group),
  optional "highlights" (array of 0-3 extra bullet strings for context).
- For Manoeuvres, include separate skill entries per manoeuvre (forward bay, reverse bay, pull up on right, parallel) when the learner flagged them — never only the word "manoeuvres" without specifics.
- nextSteps: 3-6 concrete actions.
- summary and coachMessage should be concise.`;

export async function generateReadinessReport({ assessment, deterministic }: GenerateArgs) {
  const reflectionSignals = mapMockTestReflectionSignals(assessment);
  const manoeuvreLabels = assessment.weakAreas
    .filter((id) => isManoeuvreWeakArea(id))
    .map((id) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id);
  const manoeuvrePrompt =
    manoeuvreLabels.length > 0
      ? `\nManoeuvres: include named skill entries for: ${manoeuvreLabels.join("; ")}.\n`
      : "";

  const userPrompt = `Assessment data (normalised):
${JSON.stringify(assessment)}
${manoeuvrePrompt}
Deterministic baseline (source of truth for score/label and grouped risk structure — align riskAreas to these groupKeys where possible):
${JSON.stringify(deterministic)}

Official skill group titles (use matching groupLabel spelling):
${officialGroupTitles}

Reflection signals for narrative enrichment (DO NOT alter score/label from these):
${JSON.stringify(reflectionSignals)}

Reflection usage rules:
1) Prioritise structured categorySignals over extractedKeywords when both exist.
2) Use reinforcedGroups to sharpen risk-area summaries.
3) Use coachToneHints only to shape coachMessage tone.
4) Use nextStepHints to make nextSteps more concrete.
5) If reflection signals are empty, proceed with deterministic + weak areas only.

Important constraints:
1) Preserve readinessScore exactly as ${deterministic.readinessScore}.
2) Preserve readinessLabel exactly as "${deterministic.readinessLabel}".
3) Align riskAreas with the deterministic grouping (same groupKey / skills keys where possible); enrich summary and highlights to be specific and practical.
4) Enrich summary, nextSteps, recommendedHours, and coachMessage.
5) Return JSON only.`;

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

  const parsed = aiReadinessReportSchema.safeParse(parsedRaw);
  if (!parsed.success) {
    throw new Error("OpenAI response failed schema validation");
  }

  return {
    ...parsed.data,
    readinessScore: deterministic.readinessScore,
    readinessLabel: deterministic.readinessLabel,
    model: getOpenAiConfig().model,
  };
}
