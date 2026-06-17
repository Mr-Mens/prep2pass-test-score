import { ALL_FAULT_SECTIONS } from "@/lib/instructor/mock-test-rows";
import type { MockTestFormPayload } from "@/lib/instructor/mock-test-schemas";
import { normalizeFaultCell } from "@/lib/instructor/mock-test-schemas";
import type {
  FaultMarks,
  MockTestOutcome,
  MockTestRiskAreaEntry,
  MockTestSummary,
  MockTestTopRiskAreas,
} from "@/lib/instructor/types";

/** More than this many minors on one row counts as a serious (same category). */
export const MINOR_TALLY_CAP = 3;

const FAULT_KEYS = ALL_FAULT_SECTIONS.map((sec) => sec.key);

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

function formatRiskDisplayLabel(sectionTitle: string, rowLabel: string, minorCount: number, bucket: keyof MockTestTopRiskAreas) {
  const base =
    sectionTitle.trim().toLowerCase() === rowLabel.trim().toLowerCase()
      ? rowLabel
      : `${sectionTitle}: ${rowLabel}`;

  if (bucket === "driving" && minorCount > 0) {
    return `${base} (${minorCount})`;
  }
  return base;
}

function classifyRowSeverity(m: FaultMarks): keyof MockTestTopRiskAreas | null {
  if (m.dangerous) return "dangerous";
  if (m.serious || m.minorCount > MINOR_TALLY_CAP) return "serious";
  if (m.minorCount > 0) return "driving";
  return null;
}

function buildTopRiskAreas(payload: MockTestFormPayload): MockTestTopRiskAreas {
  const topRiskAreas: MockTestTopRiskAreas = {
    dangerous: [],
    serious: [],
    driving: [],
  };

  for (const sec of ALL_FAULT_SECTIONS) {
    const block = payload[sec.key] as Record<string, unknown> | undefined;
    if (!block) continue;
    for (const row of sec.rows) {
      const marks = getCell(block, row.id);
      const bucket = classifyRowSeverity(marks);
      if (!bucket) continue;

      const entry: MockTestRiskAreaEntry = {
        compositeId: `${sec.key}:${row.id}`,
        sectionTitle: sec.title,
        rowLabel: row.label,
        displayLabel: formatRiskDisplayLabel(sec.title, row.label, marks.minorCount, bucket),
        minorCount: marks.minorCount,
      };
      topRiskAreas[bucket].push(entry);
    }
  }

  const severityRank = (bucket: keyof MockTestTopRiskAreas, entry: MockTestRiskAreaEntry) =>
    bucket === "driving" ? entry.minorCount : rowScore(getCellFromPayload(payload, entry.compositeId));

  for (const bucket of ["dangerous", "serious", "driving"] as const) {
    topRiskAreas[bucket].sort((a, b) => severityRank(bucket, b) - severityRank(bucket, a));
  }

  return topRiskAreas;
}

function getCellFromPayload(payload: MockTestFormPayload, compositeId: string): FaultMarks {
  const [sectionKey, rowId] = compositeId.split(":");
  if (!sectionKey || !rowId) return { minorCount: 0, serious: false, dangerous: false };
  const block = payload[sectionKey as keyof MockTestFormPayload];
  if (!block || typeof block !== "object") return { minorCount: 0, serious: false, dangerous: false };
  return getCell(block as Record<string, unknown>, rowId);
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

  const topRiskAreas = buildTopRiskAreas(payload);

  const suggestedFocus: string[] = [];
  if (topRiskAreas.dangerous.length) {
    suggestedFocus.push("Address dangerous faults before the next mock.");
  }
  if (topRiskAreas.serious.length) {
    suggestedFocus.push("Review serious faults with your pupil on the next lesson.");
  }
  if (topRiskAreas.driving.length) {
    suggestedFocus.push(`Reduce repeat driving faults in ${topRiskAreas.driving[0]?.sectionTitle ?? "weak areas"}.`);
  } else if (weakCategories.length) {
    suggestedFocus.push(`Stabilise ${weakCategories[0]} routines first.`);
  }
  if (agg.minorFaultCount > Math.floor(minorThreshold * 0.7) && agg.seriousFaultCount + agg.dangerousFaultCount === 0) {
    suggestedFocus.push("Fault count is approaching typical threshold. Tighten consistency.");
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
    topRiskAreas,
  };
}

/** Recompute summary when stored JSON predates topRiskAreas grouping. */
export function resolveMockTestSummary(
  payload: MockTestFormPayload,
  minorThreshold: number,
  stored?: MockTestSummary | null,
): MockTestSummary {
  if (stored?.topRiskAreas) return stored;
  return buildMockTestSummary(payload, minorThreshold);
}
