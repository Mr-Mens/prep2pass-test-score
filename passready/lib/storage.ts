import { normalizeGroupedRiskAreas } from "./risk-areas";
import {
  pendingAssessmentRecordSchema,
  persistedAssessmentRecordV2LegacySchema,
  persistedAssessmentRecordV2Schema,
  persistedAssessmentRecordSchema,
  type PendingAssessmentRecord,
  type PersistedAssessmentRecordV2,
  type StoredAssessmentV1,
} from "./validation";

/** Migrate older v2 saves that stored flat string risk lines. */
function normalizeStoredAssessmentJson(json: unknown): unknown {
  if (!json || typeof json !== "object") return json;
  const row = json as { version?: number; result?: { riskAreas?: unknown[] } };
  if (row.version !== 2 || !row.result?.riskAreas) return json;
  const ra = row.result.riskAreas;
  if (Array.isArray(ra) && ra.length > 0 && typeof ra[0] === "string") {
    return {
      ...row,
      result: {
        ...row.result,
        riskAreas: normalizeGroupedRiskAreas(ra as string[]),
      },
    };
  }
  return json;
}

export const ASSESSMENT_STORAGE_KEY = "passready_assessment";
export const PENDING_ASSESSMENT_STORAGE_KEY = "passready_pending_assessment";

export type NormalizedPersistedRecord = StoredAssessmentV1 | PersistedAssessmentRecordV2;

export function savePersistedRecord(record: NormalizedPersistedRecord): void {
  try {
    localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // QuotaExceededError or private mode
  }
}

export function saveScoredAssessment(record: PersistedAssessmentRecordV2): void {
  savePersistedRecord(record);
}

export function loadPersistedRecord(): NormalizedPersistedRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (!raw) return null;

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return null;
    }

    const parsed = persistedAssessmentRecordSchema.safeParse(normalizeStoredAssessmentJson(json));
    if (!parsed.success) return null;

    // Upgrade older v2 records that predate coachMessage/metadata.
    const currentV2 = persistedAssessmentRecordV2Schema.safeParse(parsed.data);
    if (currentV2.success) {
      return currentV2.data;
    }

    const legacyV2 = persistedAssessmentRecordV2LegacySchema.safeParse(parsed.data);
    if (legacyV2.success) {
      const upgraded: PersistedAssessmentRecordV2 = {
        version: 2,
        submittedAt: legacyV2.data.submittedAt,
        assessment: legacyV2.data.assessment,
        result: {
          ...legacyV2.data.result,
          coachMessage:
            "Keep working one routine at a time. Consistency under pressure is the fastest route to test readiness.",
          metadata: {
            source: "fallback",
            generatedAt: legacyV2.data.submittedAt,
          },
        },
      };
      saveScoredAssessment(upgraded);
      return upgraded;
    }

    if (parsed.data.version === 1) {
      return parsed.data;
    }

    return null;
  } catch {
    return null;
  }
}

export function clearStoredAssessment(): void {
  try {
    localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function savePendingAssessment(record: PendingAssessmentRecord): void {
  try {
    localStorage.setItem(PENDING_ASSESSMENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

export function loadPendingAssessment(): PendingAssessmentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_ASSESSMENT_STORAGE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw) as unknown;
    const parsed = pendingAssessmentRecordSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearPendingAssessment(): void {
  try {
    localStorage.removeItem(PENDING_ASSESSMENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
