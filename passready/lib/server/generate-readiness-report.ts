import "server-only";

import { WEAK_AREA_OPTIONS } from "@/lib/constants";
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

const systemPrompt = `You are an experienced UK driving instructor writing concise readiness guidance.
Rules:
- Safety-first and practical.
- No hype, no fluff, no vague motivational language.
- Do not claim DVSA authority or official DVSA affiliation.
- Do not guarantee pass/fail outcomes.
- Do not provide unsafe, illegal, or non-compliant advice.
- Keep language clear for learner drivers.
- Return STRICT JSON only with keys:
  readinessScore, readinessLabel, summary, riskAreas, nextSteps, recommendedHours, coachMessage
- riskAreas: array of 2-6 objects. Each object MUST have:
  "group" (string — one of the skill group titles provided in the user message),
  "severity" ("high" | "medium" | "low"),
  "issues" (array of 1-4 short bullet strings for that group).
- Structure risks by skill group — do not return a flat list of strings.
- For group "Manoeuvres", name the specific manoeuvre the learner flagged (e.g. reverse bay parking, parallel parking) — never only the word "manoeuvres" without naming which one.
- nextSteps: 3-6 concrete actions.
- summary and coachMessage should be concise.`;

export async function generateReadinessReport({ assessment, deterministic }: GenerateArgs) {
  const manoeuvreLabels = assessment.weakAreas
    .filter((id) => isManoeuvreWeakArea(id))
    .map((id) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id);
  const manoeuvrePrompt =
    manoeuvreLabels.length > 0
      ? `\nManoeuvres: issues for group "Manoeuvres" must refer to these by name where relevant: ${manoeuvreLabels.join("; ")}.\n`
      : "";

  const userPrompt = `Assessment data (normalised):
${JSON.stringify(assessment)}
${manoeuvrePrompt}
Deterministic baseline (source of truth for score/label and grouped risk structure):
${JSON.stringify(deterministic)}

Use these exact group titles when populating riskAreas[].group (pick those that apply):
- Basics
- Control and Positioning
- Observation, Signalling and Planning
- Junctions, Roundabouts and Crossings
- Manoeuvres
- Road Types
- Driving Conditions
- Independent Driving

Important constraints:
1) Preserve readinessScore exactly as ${deterministic.readinessScore}.
2) Preserve readinessLabel exactly as "${deterministic.readinessLabel}".
3) Align riskAreas with the deterministic grouping where possible; enrich issue wording to be specific and practical.
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

  // Deterministic score/label remain canonical.
  return {
    ...parsed.data,
    readinessScore: deterministic.readinessScore,
    readinessLabel: deterministic.readinessLabel,
    model: getOpenAiConfig().model,
  };
}
