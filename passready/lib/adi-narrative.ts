import { WEAK_AREA_OPTIONS, type WeakAreaId } from "@/lib/constants";
import { productMeta } from "@/lib/product-skill-map";
import { readinessVerdictForScore } from "@/lib/readiness-calibration";
import type { ReadinessLabel } from "@/lib/validation";

/** Phrases UK ADIs rarely use; map to natural UK alternatives. */
const BANNED_PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bjunction work\b/gi, "junctions"],
  [/\btraffic negotiation\b/gi, "emerging and meeting traffic"],
  [/\bvehicle handling\b/gi, "vehicle control"],
  [/\bdriver development\b/gi, "progress"],
  [/\broadway\b/gi, "road"],
  [/\bmanoeuver\b/gi, "manoeuvre"],
  [/\bintersection\b/gi, "junction"],
  [/\bturn signal\b/gi, "indicator"],
  [/\bparking lot\b/gi, "car park"],
  [/\broad test\b/gi, "driving test"],
  [/\bbehind the wheel\b/gi, "on the road"],
  [/\bdefensive driving programme\b/gi, "safe driving habits"],
  [/\boperator control\b/gi, "vehicle control"],
  [/\broute-following\b/gi, "following directions"],
  [/\bsimulation pressure scenario\b/gi, "mock-test style pressure"],
  [/\ba mock is not worth much yet\b/gi, "a mock will be more useful once the basics are consistent"],
];

/** Vague coaching lines that should trigger a quality retry. */
const VAGUE_COPY_PATTERNS: RegExp[] = [
  /\bimprove junctions\b/i,
  /\bwork on observations\b/i,
  /\bbe more confident\b/i,
  /\byour observations and planning are generally sound\b/i,
  /\bclear strengths in your control and planning\b/i,
  /\bmoving towards test readiness\b/i,
  /\bin a sensible way\b/i,
  /\bthe learner (is|has|was)\b/i,
  /\b(?:they|he|she) (?:is|has|need)\b/i,
  /\b(?:algorithm|artificial intelligence|language model|chatbot)\b/i,
  /\b(?:system predicts|algorithmic forecast|data suggests)\b/i,
  /\b(?:you will pass|guaranteed pass|pass guarantee)\b/i,
];

export const WEAK_AREA_BEHAVIOUR_FOCUS: Record<WeakAreaId, string> = {
  mirrors: "make mirror checks before changing speed or direction",
  speedControl: "slow the approach so you have more time to assess hazards and limits",
  junctions: "check earlier before emerging and avoid rushing the decision when looking for a safe gap",
  roundabouts: "choose your lane earlier on approach and keep observations through the exit",
  movingOffSafely: "take a full observation routine before moving off and joining traffic smoothly",
  lanePositioning: "hold a steady road position with safe space around parked cars and hazards",
  forwardBayParking: "keep the bay approach slow with observations through the full move",
  reverseBayParking: "reverse slowly with all-round observations and accurate line control",
  pullUpOnRightReverse: "stop safely on the right, reverse two car lengths, then rejoin with full observations",
  parallelParking: "keep the manoeuvre slow with observations while positioning next to the kerb",
  independentDriving: "plan ahead when following signs or sat-nav so lane choice stays early and calm",
  countryRoads: "meet oncoming traffic calmly with sensible speed and position on narrow sections",
  dualCarriageways: "match joining speed on slip roads and keep lane discipline at higher speeds",
  motorways: "plan joining gaps early and avoid lingering in the middle lane without reason",
  nightDriving: "use lights correctly and judge speed with reduced visibility",
  weatherConditions: "leave more space and adjust speed early when grip is lower",
};

export function learnerFirstName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? "there";
}

export function readinessVerdictPhrase(label: ReadinessLabel, score?: number): string {
  if (score != null) return readinessVerdictForScore(label, score);
  switch (label) {
    case "Needs More Time":
      return "you are still building foundations and not close to test ready yet";
    case "Building Consistency":
      return "you are developing well but not test ready yet";
    case "Nearly Test Ready":
      return "you are nearly test ready";
    case "Test Ready":
      return "you are test ready on current evidence, but silly mistakes and pressure still matter";
  }
}

export function primaryWeakAreaBehaviour(weakAreas: WeakAreaId[]): string {
  const primary = weakAreas[0];
  if (!primary) {
    return "keep your observations and decision-making consistent on familiar routes before stretching onto harder roads";
  }
  return WEAK_AREA_BEHAVIOUR_FOCUS[primary] ?? productMeta(primary).issueLine.split(":")[1]?.trim() ?? "practise one clear routine until it feels automatic";
}

export function weakAreaLabels(ids: WeakAreaId[]): string[] {
  return ids.map((id) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id);
}

export function polishAdiCopy(text: string): string {
  let out = text;
  for (const [pattern, replacement] of BANNED_PHRASE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, " ").trim();
}

export type AdiCopyQualityIssue = {
  field: "summary" | "coachMessage" | "riskArea" | "nextStep";
  message: string;
};

export function assessAdiCopyQuality(
  text: string,
  field: AdiCopyQualityIssue["field"],
): AdiCopyQualityIssue[] {
  const issues: AdiCopyQualityIssue[] = [];
  const trimmed = text.trim();
  if (!trimmed) {
    issues.push({ field, message: "empty copy" });
    return issues;
  }

  for (const [pattern] of BANNED_PHRASE_REPLACEMENTS) {
    const probe = new RegExp(pattern.source, pattern.flags.replace("g", ""));
    if (probe.test(trimmed)) {
      issues.push({ field, message: `banned phrase: ${pattern.source}` });
    }
  }

  for (const pattern of VAGUE_COPY_PATTERNS) {
    if (pattern.test(trimmed)) {
      issues.push({ field, message: `vague or disallowed phrasing: ${pattern.source}` });
    }
  }

  if (field === "summary" || field === "coachMessage") {
    const words = trimmed.split(/\s+/).length;
    if (field === "summary" && (words < 55 || words > 170)) {
      issues.push({ field, message: `summary length ${words} words (target 80-140)` });
    }
    if (field === "coachMessage" && (words < 35 || words > 120)) {
      issues.push({ field, message: `coach note length ${words} words (target 60-90)` });
    }
    if (/\b(?:I am|I'm) (?:an )?(?:AI|artificial)\b/i.test(trimmed)) {
      issues.push({ field, message: "mentions AI" });
    }
  }

  return issues;
}

export function assessReportNarrativeQuality(input: {
  summary: string;
  coachMessage: string;
}): AdiCopyQualityIssue[] {
  return [
    ...assessAdiCopyQuality(input.summary, "summary"),
    ...assessAdiCopyQuality(input.coachMessage, "coachMessage"),
  ];
}

/** Prompt appendix listing quality failures for a repair pass. */
export function formatAdiQualityRepairBrief(issues: AdiCopyQualityIssue[]): string {
  const lines = issues.map((i) => `- ${i.field}: ${i.message}`);
  return `Quality check failed. Fix ONLY summary and coachMessage:\n${lines.join("\n")}\nKeep score-linked facts accurate. Use British English. Be specific about driving behaviour. No banned American phrases. No pass guarantees. No AI mentions.`;
}
