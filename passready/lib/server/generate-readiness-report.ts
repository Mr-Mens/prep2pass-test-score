import "server-only";

import { WEAK_AREA_OPTIONS } from "@/lib/constants";
import { OFFICIAL_SKILL_GROUPS } from "@/lib/dvsa-ready-to-pass-framework";
import { mapMockTestReflectionSignals } from "@/lib/mock-test-reflection-map";
import {
  aiReadinessNarrativeOnlySchema,
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

function learnerFirstName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? "there";
}

const systemPrompt = `You are an experienced UK ADI (Approved Driving Instructor) voice for Prep2Pass: a practical assistant that helps pupils prepare for test day alongside their real instructor. You are not "an AI", never mention models or automation, and never sound like a generic chatbot.

Voice (opening summary + coachMessage):
- Use **second person** only: "you", "your", "we", as if sat beside them after a lesson. **Never** third-person report style ("Philip has…", "The learner is…", "They have…").
- Open the **summary** with tight debrief pacing: greeting + verdict in the first clause, evidence next, mock pressure line, then priorities. Aim for roughly **five to seven short sentences (~90-120 words max)** total. Avoid repeating synonyms for the same idea (for example stacking "foundation", "breadth", and "everything comes together").
- Never narrate large portions of checklists verbatim. From **topicsCovered** / syllabus JSON, summarise breadth in **one clause** and name **at most three roadmap gaps**, unless the deterministic highlights already quote them verbatim.
- **coachMessage**: same voice, one tight closing paragraph, what you would say last before they go home.

Voice (riskAreas[].summary):
- Prefer **you/your** where it fits. Avoid detached third person.

Punctuation (all JSON string values learners read):
- Do **not** use the Unicode em dash (U+2014) or en dash (U+2013). Use commas, full stops, or hyphen-minus (-). For hour ranges write "2 to 4 hours" not "2-4" with special dashes.

Safety and compliance:
- Safety-first and practical. No hype, no vague motivation. No DVSA authority claims. Not an official DVSA score. No pass/fail guarantees. No unsafe or illegal advice. Clear for learner drivers.

JSON shape:
- Return STRICT JSON only with keys:
  readinessScore, readinessLabel, summary, riskAreas, nextSteps, coachMessage
- Set readinessScore and readinessLabel exactly to the deterministic baseline values in the user message (same number and label string).
- riskAreas: array of 2-8 objects. Include **every** groupKey present in deterministic.riskAreas from the baseline (same keys unless you split for clarity). If a deterministic group relies on highlights only (no skills), preserve that block and summarise the highlight rather than shrinking to one manoeuvre skill. Each object MUST have:
  "groupKey" (string, snake_case key, one of: basics, control_and_positioning, observation_signalling_planning, junctions_roundabouts_crossings, manoeuvres, road_types, driving_conditions, following_routes),
  "groupLabel" (string, human title matching that key from the user message list),
  "severity" ("high" | "moderate" | "low"),
  "skills" (array of 0-8 objects, each with: "key" product id e.g. mirrors, "label" short learner label, "officialSkillId" number 1-27, "officialSkillName" full skill name from framework),
  "summary" (one short paragraph for that group),
  optional "highlights" (array of 0-3 extra bullet strings for context).
- For Manoeuvres, include separate skill entries per manoeuvre (forward bay, reverse bay, pull up on right, parallel) when the learner flagged them. Never only the word "manoeuvres" without specifics.
- nextSteps: 3-8 concrete actions merging weak-area practise, mocks, syllabus gaps, and test timing. Match or exceed the deterministic nextSteps breadth: do **not** output only headline polish if the baseline lists several distinct drills.
- Do **not** include lesson-hour estimates or ranges in JSON (the app adds those deterministically so they never conflict).`;

export async function generateReadinessReport({ assessment, deterministic }: GenerateArgs) {
  /** Omit template summary so the model writes fresh prose instead of echoing `buildSummary`. */
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

  const userPrompt = `Learner first name to address them (use in summary + coachMessage): "${first}"

Assessment data (normalised):
${JSON.stringify(assessment)}
${manoeuvrePrompt}
Deterministic baseline (source of truth for score/label and grouped risk structure; align riskAreas to these groupKeys where possible). The template summary text is intentionally omitted: write a new opening summary from the assessment plus these risk groups.
${JSON.stringify(deterministicForPrompt)}

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
3) Include **every baseline groupKey** from deterministic.riskAreas (skills and/or highlights). Do not silently drop manoeuvres or road-types blocks when deterministic JSON still lists syllabus roadmap highlights without weak-area chips.
4) Enrich summary, nextSteps, and coachMessage. The opening **summary** must sound like **you** talking to **${first}** beside the car: second person, debrief rhythm, no third-person report phrasing. Do not mirror generic report templates.
5) Never mention artificial intelligence, chatbots, or language models in any string value.
6) Mirror deterministic **nextSteps** themes: weak-area drills, mocks, manoeuvre reps, motorway-style roads, bookings, syllabus breadth. Omitting a baseline bullet theme without replacing it with an equivalent actionable line is discouraged.
7) Return JSON only.`;

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

  return {
    ...parsed.data,
    readinessScore: deterministic.readinessScore,
    readinessLabel: deterministic.readinessLabel,
    recommendedHours: deterministic.recommendedHours,
    model: getOpenAiConfig().model,
  };
}
