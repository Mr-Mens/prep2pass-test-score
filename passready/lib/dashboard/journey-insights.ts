import { WEAK_AREA_OPTIONS, type WeakAreaId } from "@/lib/product-skill-map";

import type { JourneySnapshot } from "./journey-types";

function labelForWeakArea(id: WeakAreaId): string {
  return WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

/** Frequency of each weak-area id across all checkpoints (self-reported friction). */
function weakAreaFrequency(all: JourneySnapshot[]): Map<WeakAreaId, number> {
  const m = new Map<WeakAreaId, number>();
  for (const s of all) {
    for (const id of s.weak_areas) {
      m.set(id, (m.get(id) ?? 0) + 1);
    }
  }
  return m;
}

/**
 * Comparative strength signal: skills that seldom appear among self-reported friction across check-ins.
 * Restrained: avoids claiming DVSA examiner outcomes from checkboxes alone.
 */
export function deriveStrongestPhrase(all: JourneySnapshot[], latest: JourneySnapshot | null): string {
  if (!latest || all.length === 0) {
    return "Save a second report and we can show which skills look strongest.";
  }
  const freq = weakAreaFrequency(all);
  let calmId = WEAK_AREA_OPTIONS[0]!.id as WeakAreaId;
  let calmHits = Infinity;
  for (const o of WEAK_AREA_OPTIONS) {
    const hits = freq.get(o.id as WeakAreaId) ?? 0;
    if (hits < calmHits) {
      calmHits = hits;
      calmId = o.id as WeakAreaId;
    }
  }
  const name = labelForWeakArea(calmId);
  if (calmHits === 0 && all.length >= 2) {
    return `${name} has rarely appeared in your weak areas. You can build on that strength.`;
  }
  if (!latest.weak_areas.includes(calmId)) {
    return `${name} is not flagged in your latest report. Keep practising it so it stays solid.`;
  }
  return `${name} comes up less often than your other weak areas. Keep working on it when you can.`;
}

export function deriveFocusArea(latest: JourneySnapshot | null): string | null {
  if (!latest || latest.weak_areas.length === 0) return null;
  const primary = labelForWeakArea(latest.weak_areas[0]!);
  if (latest.weak_areas.length === 1) {
    return `Practise ${primary} in your next lessons and private drives.`;
  }
  const second = labelForWeakArea(latest.weak_areas[1]!);
  return `Practise ${primary} and ${second} while they are fresh in your mind.`;
}

export function deriveNextMilestone(latest: JourneySnapshot | null): string {
  if (!latest) return "Complete your first assessment to get personalised next steps.";
  const { readiness_score: s, readiness_label: lb } = latest;
  if (lb === "Test Ready") {
    return "Keep doing what is working. Short practice drives help you stay ready for test day.";
  }
  if (lb === "Nearly Test Ready") {
    return "Work on what still makes you nervous: mirrors, junctions, and parking.";
  }
  if (lb === "Building Consistency") {
    return "Practise on different roads and at different times of day. Repeat familiar routes during the week until they feel easy.";
  }
  /** Needs More Time or unknown */
  if (s < 40) {
    return "Build confidence on roads you know well before trying busy or unfamiliar routes.";
  }
  return "Use your instructor's feedback and practise regularly so new skills stick.";
}

export type MomentumVoice = {
  headline: string;
  subline: string;
  tone: "lift" | "hold" | "soften" | "open";
};

/**
 * Emotional, instructor-adjacent copy that stays off leaderboard clichés.
 */
export function deriveMomentumVoice(snapshots: JourneySnapshot[], deltaVsPrev: number | null): MomentumVoice {
  if (snapshots.length <= 1) {
    return {
      headline: "First report saved",
      subline: "This is your starting point. Your next assessment will show whether your score is moving up or down.",
      tone: "open",
    };
  }

  const chrono = snapshots;
  const n = chrono.length;
  const deltas: number[] = [];
  for (let i = 1; i < n; i++) {
    deltas.push(chrono[i]!.readiness_score - chrono[i - 1]!.readiness_score);
  }
  const last3 = deltas.slice(-3);
  const positives = last3.filter((d) => d > 0).length;
  const negatives = last3.filter((d) => d < 0).length;
  const lastDelta = deltas[deltas.length - 1] ?? 0;

  if (deltaVsPrev !== null && deltaVsPrev !== 0) {
    const sign = deltaVsPrev > 0 ? "+" : "";
    const headline = `${sign}${deltaVsPrev} since last report`;
    if (deltaVsPrev > 5 && positives >= 2) {
      return {
        headline,
        subline: "Your score is improving steadily. Keep practising the skills that are working.",
        tone: "lift",
      };
    }
    if (deltaVsPrev > 0) {
      return {
        headline,
        subline: "Your score went up. Keep working on the same areas your instructor suggests.",
        tone: "lift",
      };
    }
    if (deltaVsPrev < -5 || negatives >= 2) {
      return {
        headline,
        subline:
          "A lower score does not always mean you are getting worse. Focus on what your instructor praised last time.",
        tone: "soften",
      };
    }
    return {
      headline,
      subline: "Your score stayed similar. Steady practice still helps skills sink in.",
      tone: "hold",
    };
  }

  if (lastDelta === 0 && deltas.length > 1) {
    return {
      headline: "Held steady",
      subline: "Your score has stayed the same. Keep practising before trying harder routes.",
      tone: "hold",
    };
  }

  if (positives >= 2 && negatives === 0) {
    return {
      headline: "Score trending up",
      subline:
        deltas.length >= 3 && last3.every((d) => d >= 0)
          ? "Your last three reports all improved or held steady."
          : "Your recent reports show improvement.",
      tone: "lift",
    };
  }

  return {
    headline: "Still building",
    subline:
      positives > negatives
        ? "You have had more improvements than dips recently. That is normal progress."
        : "Scores can go up and down between lessons. That is normal while you are learning.",
    tone: "open",
  };
}

export type JourneyTag = { key: string; label: string };

export function deriveJourneyTags(snapshots: JourneySnapshot[]): JourneyTag[] {
  if (snapshots.length === 0) return [];

  const latest = snapshots[snapshots.length - 1]!;
  const tags: JourneyTag[] = [];

  if (snapshots.length === 1) {
    tags.push({ key: "first", label: "First assessment" });
  } else {
    tags.push({ key: "returning", label: "Continuing journey" });
  }

  if (snapshots.some((s) => s.mock_test_taken)) {
    tags.push({ key: "mock", label: "Mock completed" });
  }

  for (let i = 1; i < snapshots.length; i++) {
    const jump = snapshots[i]!.readiness_score - snapshots[i - 1]!.readiness_score;
    if (jump >= 10) {
      tags.push({ key: "jump10", label: "Ten-point uplift" });
      break;
    }
  }

  if (
    (latest.readiness_label === "Nearly Test Ready" ||
      (latest.readiness_score >= 65 && latest.readiness_score <= 82)) &&
    latest.readiness_label !== "Test Ready"
  ) {
    tags.push({ key: "nearly", label: "Nearly test-ready" });
  }

  if (latest.readiness_label === "Test Ready") {
    tags.push({ key: "ready", label: "Test-ready signal" });
  }

  /** Dedupe by key, preserve order */
  const seen = new Set<string>();
  return tags.filter((t) => (seen.has(t.key) ? false : (seen.add(t.key), true))).slice(0, 6);
}

export function deriveDeltaVsPrior(snapshots: JourneySnapshot[]): number | null {
  const n = snapshots.length;
  if (n < 2) return null;
  return snapshots[n - 1]!.readiness_score - snapshots[n - 2]!.readiness_score;
}
