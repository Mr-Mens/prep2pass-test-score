import { ALL_FAULT_SECTIONS } from "@/lib/instructor/mock-test-rows";
import type { MockTestFormPayload } from "@/lib/instructor/mock-test-schemas";
import { normalizeFaultCell } from "@/lib/instructor/mock-test-schemas";
import type { FaultMarks, MockTestOutcome, MockTestSummary } from "@/lib/instructor/types";

/** More than this many minors on one row counts as a serious (same category). */
export const MINOR_TALLY_CAP = 3;

const FAULT_KEYS = [
  "manoeuvres",
  "showMeTellMe",
  "controlledStop",
  "control",
  "moveOff",
  "mirrors",
  "signals",
  "junctions",
  "judgement",
  "positioningCore",
  "progress",
  "responseSigns",
] as const;

function getCell(rec: Record<string, unknown>, id: string): FaultMarks {
  return normalizeFaultCell(rec[id]);
}

/** Per row: only the first `MINOR_TALLY_CAP` minors count toward the minor total; beyond that counts as one serious on this line. */
function effectiveRowFaults(m: FaultMarks) {
  const minorsTowardTotal = Math.min(m.minorCount, MINOR_TALLY_CAP);
  const serious = m.serious || m.minorCount > MINOR_TALLY_CAP ? 1 : 0;
  const dangerous = m.dangerous ? 1 : 0;
  return { minorsTowardTotal, serious, dangerous };
}

function countFaultsInRecord(rec: Record<string, unknown>) {
  let minor = 0;
  let serious = 0;
  let dangerous = 0;
  for (const id of Object.keys(rec)) {
    const m = getCell(rec, id);
    const e = effectiveRowFaults(m);
    minor += e.minorsTowardTotal;
    serious += e.serious;
    dangerous += e.dangerous;
  }
  return { minor, serious, dangerous, drivingFaults: minor };
}

export function aggregateFaultCounts(payload: MockTestFormPayload) {
  let minor = 0;
  let serious = 0;
  let dangerous = 0;
  for (const k of FAULT_KEYS) {
    const block = payload[k];
    if (!block || typeof block !== "object") continue;
    const c = countFaultsInRecord(block as Record<string, unknown>);
    minor += c.minor;
    serious += c.serious;
    dangerous += c.dangerous;
  }
  return {
    minorFaultCount: minor,
    seriousFaultCount: serious,
    dangerousFaultCount: dangerous,
    drivingFaultCount: minor,
  };
}

export function computeMockOutcome(
  payload: MockTestFormPayload,
  minorThreshold: number,
): { outcome: MockTestOutcome; failReason: string | null } {
  const { minorFaultCount, seriousFaultCount, dangerousFaultCount } = aggregateFaultCounts(payload);

  if (seriousFaultCount > 0 || dangerousFaultCount > 0) {
    return {
      outcome: "fail",
      failReason: `${seriousFaultCount > 0 ? "Serious fault recorded. " : ""}${dangerousFaultCount > 0 ? "Dangerous fault recorded." : ""}`.trim(),
    };
  }
  if (minorFaultCount > minorThreshold) {
    return {
      outcome: "fail",
      failReason: `Driving faults (${minorFaultCount}) exceeded threshold (${minorThreshold}).`,
    };
  }
  if (
    minorFaultCount === 0 &&
    seriousFaultCount === 0 &&
    dangerousFaultCount === 0 &&
    !payload.candidate.fullName.trim()
  ) {
    return { outcome: "undecided", failReason: null };
  }
  return { outcome: "pass", failReason: null };
}

function rowScore(m: FaultMarks): number {
  if (m.dangerous) return 5;
  const repeatEscalation = m.minorCount > MINOR_TALLY_CAP;
  if (m.serious || repeatEscalation) return 4 + Math.min(m.minorCount, MINOR_TALLY_CAP);
  return m.minorCount;
}

export function buildMockTestSummary(payload: MockTestFormPayload, minorThreshold: number): MockTestSummary {
  const agg = aggregateFaultCounts(payload);
  const scoredRows: { id: string; sectionTitle: string; score: number; marks: FaultMarks }[] = [];

  for (const sec of ALL_FAULT_SECTIONS) {
    const block = payload[sec.key] as Record<string, unknown> | undefined;
    if (!block) continue;
    for (const row of sec.rows) {
      const marks = getCell(block, row.id);
      const score = rowScore(marks);
      if (score > 0) {
        scoredRows.push({
          id: `${sec.key}:${row.id}`,
          sectionTitle: sec.title,
          score,
          marks,
        });
      }
    }
  }

  scoredRows.sort((a, b) => b.score - a.score);

  const weakRowIds = scoredRows.slice(0, 8).map((x) => x.id);
  const catMap = new Map<string, number>();
  for (const s of scoredRows) {
    catMap.set(s.sectionTitle, (catMap.get(s.sectionTitle) ?? 0) + s.score);
  }
  const weakCategories = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => k);

  const suggestedFocus: string[] = [];
  if (weakCategories.length) suggestedFocus.push(`Stabilise ${weakCategories[0]} routines first.`);
  if (agg.seriousFaultCount + agg.dangerousFaultCount > 0) {
    suggestedFocus.unshift("Address serious or dangerous items before next mock.");
  } else if (agg.minorFaultCount > Math.floor(minorThreshold * 0.7)) {
    suggestedFocus.push("Fault count is approaching typical threshold—tighten consistency.");
  }
  if (payload.instructorNotes.trim()) suggestedFocus.push("Use instructor notes below for lesson themes.");

  return {
    totalMinors: agg.minorFaultCount,
    seriousCount: agg.seriousFaultCount,
    dangerousCount: agg.dangerousFaultCount,
    failBecauseFault: agg.seriousFaultCount + agg.dangerousFaultCount > 0,
    failBecauseMinors: agg.minorFaultCount > minorThreshold,
    weakRowIds,
    weakCategories,
    suggestedFocus,
  };
}
