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
    return "Your warmest lanes surface once two honest check-ins sit side by side.";
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
    return `${name} has stayed off repeated “needs work” flags, so there is quiet headroom to lean into.`;
  }
  if (!latest.weak_areas.includes(calmId)) {
    return `${name} is not shouting for attention after the latest stint. Notice that calm wherever you spot it.`;
  }
  return `${name} is logging fewer repeats than heavier themes whilst your focus rests elsewhere; keep watering it softly.`;
}

export function deriveFocusArea(latest: JourneySnapshot | null): string | null {
  if (!latest || latest.weak_areas.length === 0) return null;
  const primary = labelForWeakArea(latest.weak_areas[0]!);
  if (latest.weak_areas.length === 1) {
    return `Give ${primary} the clearest rehearsal window before your next stint.`;
  }
  const second = labelForWeakArea(latest.weak_areas[1]!);
  return `Pair ${primary} with ${second} whilst they are alive in instructor session memory.`;
}

export function deriveNextMilestone(latest: JourneySnapshot | null): string {
  if (!latest) return "Complete one Premium check-in to start sketching the road ahead.";
  const { readiness_score: s, readiness_label: lb } = latest;
  if (lb === "Test Ready") {
    return "Hold the behaviours that already read as examiner-cal. Short top-up drives keep them honest.";
  }
  if (lb === "Nearly Test Ready") {
    return "Narrow the gaps that still spook nerves: mirror rhythm, decisive junction exits, tidy bay lines.";
  }
  if (lb === "Building Consistency") {
    return "Stretch into mixed-light routes. Mid-week repeats knit the calm your feet still owe you.";
  }
  /** Needs More Time or unknown */
  if (s < 40) {
    return "Build two calm repeats on familiar veins before stretching into unpredictable traffic.";
  }
  return "Pair lesson feedback with quieter solo reflection so muscle memory settles in layers.";
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
      headline: "First benchmark logged",
      subline:
        "Think of today as tyre tracks on frost: faint, honest, yours. Your next stint widens how clearly the lane reads.",
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
    const headline = `${sign}${deltaVsPrev} since last check`;
    if (deltaVsPrev > 5 && positives >= 2) {
      return {
        headline,
        subline: "Consistency is creeping in. Pause to savour it before you chase novelty.",
        tone: "lift",
      };
    }
    if (deltaVsPrev > 0) {
      return {
        headline,
        subline: "Momentum is behaving nicely. Reinforce the cues that unlocked this lift.",
        tone: "lift",
      };
    }
    if (deltaVsPrev < -5 || negatives >= 2) {
      return {
        headline,
        subline:
          "A dip rarely means stepping backwards; tyres cool and roads widen. Anchor on whatever your instructor last praised.",
        tone: "soften",
      };
    }
    return {
      headline,
      subline:
        "Quiet plateaus still train eyes and feet, and boredom is sometimes the shape of consolidation.",
      tone: "hold",
    };
  }

  if (lastDelta === 0 && deltas.length > 1) {
    return {
      headline: "Held steady",
      subline:
        "Repeated scores can signal disciplined habits taking root. Deepen those before widening your routes wildly.",
      tone: "hold",
    };
  }

  if (positives >= 2 && negatives === 0) {
    return {
      headline: "Arc tilting forwards",
      subline:
        deltas.length >= 3 && last3.every((d) => d >= 0)
          ? "Your last three stints leaned the same reassuring way."
          : "Recent check-ins leaned gently upward.",
      tone: "lift",
    };
  }

  return {
    headline: "Rhythm still forming",
    subline:
      positives > negatives
        ? "Ups currently outnumber dips, and instructors see that blend far more often than social feeds pretend."
        : "Mixed sessions rarely equal regress once the test clocks down; variability stays ordinary.",
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
