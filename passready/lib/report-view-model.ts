import type { EstimatedHoursInput } from "@/lib/estimated-lesson-hours";
import { computeEstimatedLessonHours } from "@/lib/estimated-lesson-hours";
import { normalizeGroupedRiskAreas, type GroupedRiskArea } from "@/lib/risk-areas";
import { buildTestPassRisks, buildTopPriorities } from "@/lib/report-insights";
import {
  confidenceDisplayLabel,
  reconcileReadinessOutcome,
  type ConfidenceDisplay,
  type ReadinessBandDisplay,
} from "@/lib/readiness-calibration";
import type { AssessmentPayload, ReadinessLabel, SyllabusProgressSnapshot, WeakAreaDetailEntry } from "@/lib/validation";
import { syllabusProgressSnapshotSchema, weakAreaDetailEntrySchema } from "@/lib/validation";
import { migrateWeakAreaIds } from "@/lib/weak-area-migration";
import { weakAreaDetailsFromRawMetadata } from "@/lib/weak-area-metadata";

export type ReportViewModel = {
  readinessScore: number;
  readinessLabel: ReadinessLabel;
  readinessBandDisplay: ReadinessBandDisplay;
  confidenceLevel: number;
  confidenceDisplay: ConfidenceDisplay;
  summary: string;
  nextSteps: string[];
  riskAreas: GroupedRiskArea[];
  testPassRisks: ReturnType<typeof buildTestPassRisks>;
  topPriorities: ReturnType<typeof buildTopPriorities>;
  estimatedHours: ReturnType<typeof computeEstimatedLessonHours>;
  syllabus: SyllabusProgressSnapshot | null;
  weakAreaDetails: WeakAreaDetailEntry[];
  mockTestTaken: AssessmentPayload["mockTestTaken"];
};

type BuildArgs = {
  readinessScore: number;
  readinessLabel: ReadinessLabel;
  summary: string;
  nextSteps: string[];
  riskAreasRaw: unknown;
  weakAreasRaw: unknown;
  lessonsTaken: number;
  mockTestTaken: boolean;
  mockTestResult: AssessmentPayload["mockTestResult"];
  seriousFaults: number;
  drivingFaults: number;
  confidenceLevel: number;
  testBooked?: AssessmentPayload["testBooked"];
  testDate?: AssessmentPayload["testDate"] | null;
  rawMetadata?: unknown;
  weakAreaDetailsRaw?: unknown;
  mockReflectionDetailsRaw?: unknown;
};

function mockReflectionDetailsFromMetadata(raw: unknown): AssessmentPayload["mockReflectionDetails"] {
  if (!raw || typeof raw !== "object") return [];
  const details = "mockReflectionDetails" in raw ? (raw as { mockReflectionDetails: unknown }).mockReflectionDetails : undefined;
  return Array.isArray(details) ? (details as AssessmentPayload["mockReflectionDetails"]) : [];
}

export function syllabusFromRawMetadata(raw: unknown): SyllabusProgressSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const syllabus = "syllabus" in raw ? (raw as { syllabus: unknown }).syllabus : undefined;
  const p = syllabusProgressSnapshotSchema.safeParse(syllabus);
  return p.success ? p.data : null;
}

export function weakAreaDetailsFromDb(raw: unknown, metadata?: unknown): WeakAreaDetailEntry[] {
  const fromColumn = weakAreaDetailsFromRawMetadata(Array.isArray(raw) ? { weakAreaDetails: raw } : null);
  if (fromColumn.length > 0) return fromColumn;
  if (Array.isArray(raw)) {
    const out: WeakAreaDetailEntry[] = [];
    for (const item of raw) {
      const parsed = weakAreaDetailEntrySchema.safeParse(item);
      if (parsed.success) out.push(parsed.data);
    }
    if (out.length > 0) return out;
  }
  return weakAreaDetailsFromRawMetadata(metadata);
}

export function buildReportViewModel(args: BuildArgs): ReportViewModel {
  const weakAreas = migrateWeakAreaIds(
    Array.isArray(args.weakAreasRaw) ? (args.weakAreasRaw as string[]) : [],
  ) as AssessmentPayload["weakAreas"];
  const riskAreas = normalizeGroupedRiskAreas(args.riskAreasRaw);
  const syllabus = syllabusFromRawMetadata(args.rawMetadata);
  const weakAreaDetails = weakAreaDetailsFromDb(args.weakAreaDetailsRaw, args.rawMetadata);

  const hoursInput: EstimatedHoursInput = {
    lessonsTaken: args.lessonsTaken,
    mockTestTaken: args.mockTestTaken ? "yes" : "no",
    mockTestResult: args.mockTestResult,
    seriousFaults: args.seriousFaults,
    drivingFaults: args.drivingFaults,
    weakAreas,
    confidenceLevel: args.confidenceLevel,
    testBooked: args.testBooked,
    testDate: args.testDate ?? undefined,
    syllabus,
  };

  const testPassRisks = buildTestPassRisks({
    weakAreas,
    weakAreaDetails,
    confidenceLevel: args.confidenceLevel,
    mockTestTaken: args.mockTestTaken ? "yes" : "no",
    mockTestResult: args.mockTestResult,
    mockReflectionDetails: mockReflectionDetailsFromMetadata(args.rawMetadata),
    riskAreas,
    syllabus,
  });

  const topPriorities = buildTopPriorities({
    weakAreas,
    weakAreaDetails,
    syllabus,
    testBooked: args.testBooked ?? "no",
    testDate: args.testDate ?? undefined,
    mockTestTaken: args.mockTestTaken ? "yes" : "no",
    nextSteps: args.nextSteps,
  });

  const estimatedHours = computeEstimatedLessonHours(hoursInput, args.readinessScore);

  const reconciled = reconcileReadinessOutcome({
    score: args.readinessScore,
    label: args.readinessLabel,
    estimatedHours,
    assessment: {
      syllabusCaptureVersion: syllabus ? 1 : undefined,
    },
    syllabus,
  });

  return {
    readinessScore: reconciled.score,
    readinessLabel: reconciled.label,
    readinessBandDisplay: reconciled.displayBand,
    confidenceLevel: args.confidenceLevel,
    confidenceDisplay: confidenceDisplayLabel(args.confidenceLevel),
    summary: args.summary,
    nextSteps: args.nextSteps,
    riskAreas,
    testPassRisks,
    topPriorities,
    estimatedHours,
    syllabus,
    weakAreaDetails,
    mockTestTaken: args.mockTestTaken ? "yes" : "no",
  };
}

export function buildReportViewModelFromAssessment(
  assessment: AssessmentPayload,
  result: {
    readinessScore: number;
    readinessLabel: ReadinessLabel;
    summary: string;
    nextSteps: string[];
    riskAreas: unknown;
    metadata?: { syllabus?: SyllabusProgressSnapshot };
  },
): ReportViewModel {
  return buildReportViewModel({
    readinessScore: result.readinessScore,
    readinessLabel: result.readinessLabel,
    summary: result.summary,
    nextSteps: result.nextSteps,
    riskAreasRaw: result.riskAreas,
    weakAreasRaw: assessment.weakAreas,
    lessonsTaken: assessment.lessonsTaken,
    mockTestTaken: assessment.mockTestTaken === "yes",
    mockTestResult: assessment.mockTestResult,
    seriousFaults: assessment.seriousFaults,
    drivingFaults: assessment.drivingFaults,
    confidenceLevel: assessment.confidenceLevel,
    testBooked: assessment.testBooked,
    testDate: assessment.testDate,
    rawMetadata: result.metadata ? { syllabus: result.metadata.syllabus } : undefined,
    weakAreaDetailsRaw: assessment.weakAreaDetails,
  });
}
