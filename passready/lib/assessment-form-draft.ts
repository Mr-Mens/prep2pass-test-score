import type { AssessmentFormValues } from "./validation";

export const ASSESSMENT_FORM_DRAFT_STORAGE_KEY = "passready_assessment_form_draft";

type AssessmentFormDraftRecord = {
  version: 1;
  savedAt: string;
  form: Partial<AssessmentFormValues>;
};

export const EMPTY_ASSESSMENT_FORM_VALUES = {
  fullName: "",
  email: "",
  lessonsTaken: "",
  testBooked: undefined,
  testDate: "",
  mockTestTaken: undefined,
  mockTestResult: "not_taken",
  seriousFaults: "",
  drivingFaults: "",
  confidenceLevel: 6,
  weakAreas: [],
  weakAreaDetails: [],
  mockReflectionCategories: [],
  mockReflectionDetails: [],
  extraNotes: "",
  syllabusCaptureVersion: 1,
  topicsCovered: [],
} as unknown as AssessmentFormValues;

const DRAFT_FIELD_KEYS = [
  "fullName",
  "email",
  "lessonsTaken",
  "testBooked",
  "testDate",
  "mockTestTaken",
  "mockTestResult",
  "seriousFaults",
  "drivingFaults",
  "confidenceLevel",
  "weakAreas",
  "weakAreaDetails",
  "mockReflectionCategories",
  "mockReflectionDetails",
  "extraNotes",
  "syllabusCaptureVersion",
  "topicsCovered",
] as const satisfies readonly (keyof AssessmentFormValues)[];

function pickDraftForm(raw: unknown): Partial<AssessmentFormValues> | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { form?: unknown };
  if (!record.form || typeof record.form !== "object") return null;

  const picked: Partial<AssessmentFormValues> = {};
  for (const key of DRAFT_FIELD_KEYS) {
    const value = (record.form as Record<string, unknown>)[key];
    if (value !== undefined) {
      (picked as Record<string, unknown>)[key] = value;
    }
  }
  return Object.keys(picked).length > 0 ? picked : null;
}

export function shouldPersistAssessmentFormDraft(values: AssessmentFormValues): boolean {
  if (values.fullName?.trim()) return true;
  if (values.email?.trim()) return true;
  if (String(values.lessonsTaken ?? "").trim()) return true;
  if (values.testBooked) return true;
  if (values.mockTestTaken) return true;
  if (values.testDate?.trim()) return true;
  if (String(values.seriousFaults ?? "").trim()) return true;
  if (String(values.drivingFaults ?? "").trim()) return true;
  if ((values.weakAreas?.length ?? 0) > 0) return true;
  if ((values.weakAreaDetails?.length ?? 0) > 0) return true;
  if ((values.mockReflectionCategories?.length ?? 0) > 0) return true;
  if ((values.mockReflectionDetails?.length ?? 0) > 0) return true;
  if (values.extraNotes?.trim()) return true;
  if ((values.topicsCovered?.length ?? 0) > 0) return true;
  if (values.confidenceLevel !== 6) return true;
  if (values.mockTestResult && values.mockTestResult !== "not_taken") return true;
  return false;
}

export function mergeAssessmentFormDefaults(input: {
  prefilledFullName?: string;
  lockedAccountEmail?: string;
}): AssessmentFormValues {
  const draft = loadAssessmentFormDraft();
  return {
    ...EMPTY_ASSESSMENT_FORM_VALUES,
    ...(draft ?? {}),
    ...(input.prefilledFullName?.trim() ? { fullName: input.prefilledFullName.trim() } : {}),
    ...(input.lockedAccountEmail?.trim() ? { email: input.lockedAccountEmail.trim().toLowerCase() } : {}),
  };
}

export function saveAssessmentFormDraft(values: AssessmentFormValues): void {
  if (typeof window === "undefined") return;
  if (!shouldPersistAssessmentFormDraft(values)) {
    clearAssessmentFormDraft();
    return;
  }

  const record: AssessmentFormDraftRecord = {
    version: 1,
    savedAt: new Date().toISOString(),
    form: values,
  };

  try {
    localStorage.setItem(ASSESSMENT_FORM_DRAFT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // QuotaExceededError or private mode
  }
}

export function loadAssessmentFormDraft(): Partial<AssessmentFormValues> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(ASSESSMENT_FORM_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw) as unknown;
    if (!json || typeof json !== "object" || (json as { version?: number }).version !== 1) return null;
    return pickDraftForm(json);
  } catch {
    return null;
  }
}

export function clearAssessmentFormDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ASSESSMENT_FORM_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
