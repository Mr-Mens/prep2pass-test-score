import type { EstimatedHoursInput } from "@/lib/estimated-lesson-hours";
import { computeEstimatedLessonHours } from "@/lib/estimated-lesson-hours";
import { normalizeGroupedRiskAreas, type GroupedRiskArea } from "@/lib/risk-areas";
import { buildTestPassRisks, buildTopPriorities } from "@/lib/report-insights";
import type { AssessmentPayload, ReadinessLabel, SyllabusProgressSnapshot } from "@/lib/validation";
import { syllabusProgressSnapshotSchema } from "@/lib/validation";
import { migrateWeakAreaIds } from "@/lib/weak-area-migration";

export type ReportViewModel = {
  readinessScore: number;
  readinessLabel: ReadinessLabel;
  summary: string;
  nextSteps: string[];
  riskAreas: GroupedRiskArea[];
  testPassRisks: ReturnType<typeof buildTestPassRisks>;
  topPriorities: ReturnType<typeof buildTopPriorities>;
  estimatedHours: ReturnType<typeof computeEstimatedLessonHours>;
  syllabus: SyllabusProgressSnapshot | null;
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
};

export function syllabusFromRawMetadata(raw: unknown): SyllabusProgressSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const syllabus = "syllabus" in raw ? (raw as { syllabus: unknown }).syllabus : undefined;
  const p = syllabusProgressSnapshotSchema.safeParse(syllabus);
  return p.success ? p.data : null;
}

export function buildReportViewModel(args: BuildArgs): ReportViewModel {
  const weakAreas = migrateWeakAreaIds(
    Array.isArray(args.weakAreasRaw) ? (args.weakAreasRaw as string[]) : [],
  ) as AssessmentPayload["weakAreas"];
  const riskAreas = normalizeGroupedRiskAreas(args.riskAreasRaw);
  const syllabus = syllabusFromRawMetadata(args.rawMetadata);

  const hoursInput: EstimatedHoursInput = {
    lessonsTaken: args.lessonsTaken,
    mockTestTaken: args.mockTestTaken ? "yes" : "no",
    mockTestResult: args.mockTestResult,
    seriousFaults: args.seriousFaults,
    drivingFaults: args.drivingFaults,
    weakAreas,
    confidenceLevel: args.confidenceLevel,
  };

  const testPassRisks = buildTestPassRisks({
    weakAreas,
    confidenceLevel: args.confidenceLevel,
    mockTestTaken: args.mockTestTaken ? "yes" : "no",
    mockTestResult: args.mockTestResult,
    riskAreas,
    syllabus,
  });

  const topPriorities = buildTopPriorities({
    weakAreas,
    syllabus,
    testBooked: args.testBooked ?? "no",
    testDate: args.testDate ?? undefined,
    mockTestTaken: args.mockTestTaken ? "yes" : "no",
    nextSteps: args.nextSteps,
  });

  return {
    readinessScore: args.readinessScore,
    readinessLabel: args.readinessLabel,
    summary: args.summary,
    nextSteps: args.nextSteps,
    riskAreas,
    testPassRisks,
    topPriorities,
    estimatedHours: computeEstimatedLessonHours(hoursInput, args.readinessScore),
    syllabus,
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
  });
}
