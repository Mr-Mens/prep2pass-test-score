import { z } from "zod";

import { WEAK_AREA_OPTIONS } from "./constants";
import { migrateWeakAreaIds } from "./weak-area-migration";

type WeakAreaId = (typeof WEAK_AREA_OPTIONS)[number]["id"];

const weakAreaIds = WEAK_AREA_OPTIONS.map((o) => o.id) as [WeakAreaId, ...WeakAreaId[]];

const countedField = (label: string, max: number) =>
  z
    .string({ required_error: label })
    .trim()
    .min(1, label)
    .refine((v) => Number.isFinite(Number(v)), { message: label })
    .transform((v) => Number.parseInt(v, 10))
    .pipe(
      z
        .number({ invalid_type_error: label })
        .int("Use a whole number")
        .min(0, "Cannot be negative")
        .max(max, "Enter a realistic value"),
    );

export const assessmentSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(120, "Name is too long"),
    email: z.string().trim().email("Enter a valid email address"),
    lessonsTaken: countedField("Enter approximate lessons", 400),
    testBooked: z.enum(["yes", "no"], {
      required_error: "Select whether your test is booked",
    }),
    testDate: z.string().optional(),
    mockTestTaken: z.enum(["yes", "no"], {
      required_error: "Select whether you have taken a mock test",
    }),
    mockTestResult: z.enum(["pass", "fail", "not_taken"], {
      required_error: "Select a mock test outcome",
    }),
    seriousFaults: countedField("Enter serious faults", 20),
    drivingFaults: countedField("Enter driving faults", 30),
    confidenceLevel: z.coerce
      .number({ invalid_type_error: "Pick a number from 1 to 10" })
      .int("Use a whole number")
      .min(1, "Minimum is 1")
      .max(10, "Maximum is 10"),
    weakAreas: z
      .array(z.string())
      .default([])
      .transform((ids) => migrateWeakAreaIds(ids))
      .pipe(z.array(z.enum(weakAreaIds))),
    extraNotes: z
      .string()
      .trim()
      .max(2000, "Notes are too long")
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
  })
  .superRefine((data, ctx) => {
    if (data.testBooked === "yes") {
      if (!data.testDate || data.testDate.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add your test date",
          path: ["testDate"],
        });
        return;
      }
      const d = new Date(data.testDate);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid date",
          path: ["testDate"],
        });
      }
    }

    if (data.mockTestTaken === "no" && data.mockTestResult !== "not_taken") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If you have not taken a mock, choose “Not taken”",
        path: ["mockTestResult"],
      });
    }

    if (data.mockTestTaken === "yes" && data.mockTestResult === "not_taken") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select pass or fail for your mock test",
        path: ["mockTestResult"],
      });
    }
  });

export type AssessmentFormValues = z.input<typeof assessmentSchema>;
export type AssessmentPayload = z.output<typeof assessmentSchema>;

/** Normalised assessment as persisted (localStorage / future API). */
export const assessmentDataSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  lessonsTaken: z.number().int().min(0).max(400),
  testBooked: z.enum(["yes", "no"]),
  testDate: z.string().optional(),
  mockTestTaken: z.enum(["yes", "no"]),
  mockTestResult: z.enum(["pass", "fail", "not_taken"]),
  seriousFaults: z.number().int().min(0).max(20),
  drivingFaults: z.number().int().min(0).max(30),
  confidenceLevel: z.number().int().min(1).max(10),
  weakAreas: z
    .array(z.string())
    .optional()
    .default([])
    .transform((ids) => migrateWeakAreaIds(ids))
    .pipe(z.array(z.enum(weakAreaIds))),
  extraNotes: z.string().optional(),
});

/** Legacy localStorage shape (assessment only; score was computed on the client). */
export const storedAssessmentSchema = z.object({
  version: z.literal(1),
  submittedAt: z.string(),
  data: assessmentDataSchema,
});

export type StoredAssessmentV1 = z.infer<typeof storedAssessmentSchema>;
/** @deprecated Prefer PersistedAssessmentRecord; kept for backwards compatibility. */
export type StoredAssessment = StoredAssessmentV1;

export const readinessLabelSchema = z.enum(["Not Ready", "Nearly Ready", "Test Ready"]);

export type ReadinessLabel = z.infer<typeof readinessLabelSchema>;

export const riskSeveritySchema = z.enum(["high", "medium", "low"]);
export type RiskSeverity = z.infer<typeof riskSeveritySchema>;

/** Grouped risk lines — aligned with practical skill themes (not an official DVSA product). */
export const groupedRiskAreaSchema = z.object({
  group: z.string().min(1),
  severity: riskSeveritySchema,
  issues: z.array(z.string().min(1)).min(1).max(8),
});
export type GroupedRiskArea = z.infer<typeof groupedRiskAreaSchema>;

/**
 * Core deterministic scoring output. Used as the base signal and fallback source of truth.
 */
export const deterministicReadinessResultSchema = z.object({
  readinessScore: z.number().int().min(0).max(100),
  readinessLabel: readinessLabelSchema,
  riskAreas: z.array(groupedRiskAreaSchema).min(1).max(8),
  recommendedHours: z.string(),
  summary: z.string(),
  nextSteps: z.array(z.string()),
});

export type DeterministicReadinessResult = z.infer<typeof deterministicReadinessResultSchema>;

export const reportMetadataSchema = z.object({
  source: z.enum(["ai", "fallback"]),
  model: z.string().optional(),
  generatedAt: z.string(),
});
export type ReportMetadata = z.infer<typeof reportMetadataSchema>;

export const aiReadinessReportSchema = z.object({
  readinessScore: z.number().int().min(0).max(100),
  readinessLabel: readinessLabelSchema,
  summary: z.string().min(1),
  riskAreas: z.array(groupedRiskAreaSchema).min(1).max(8),
  nextSteps: z.array(z.string().min(1)).min(2).max(6),
  recommendedHours: z.string().min(1),
  coachMessage: z.string().min(1),
});
export type AiReadinessReport = z.infer<typeof aiReadinessReportSchema>;

/**
 * Final response shape returned by API and persisted in storage.
 * score/label come from deterministic scoring; AI enriches narrative fields.
 */
export const mockReadinessResultSchema = aiReadinessReportSchema.extend({
  metadata: reportMetadataSchema,
});

export type MockReadinessResult = z.infer<typeof mockReadinessResultSchema>;

export const persistedAssessmentRecordV2Schema = z.object({
  version: z.literal(2),
  submittedAt: z.string(),
  assessment: assessmentDataSchema,
  result: mockReadinessResultSchema,
});

export type PersistedAssessmentRecordV2 = z.infer<typeof persistedAssessmentRecordV2Schema>;

/** Compatibility shape from earlier v2 without AI metadata/coach fields. */
export const persistedAssessmentRecordV2LegacySchema = z.object({
  version: z.literal(2),
  submittedAt: z.string(),
  assessment: assessmentDataSchema,
  result: deterministicReadinessResultSchema,
});
export type PersistedAssessmentRecordV2Legacy = z.infer<typeof persistedAssessmentRecordV2LegacySchema>;

export const persistedAssessmentRecordSchema = z.union([
  storedAssessmentSchema,
  persistedAssessmentRecordV2Schema,
  persistedAssessmentRecordV2LegacySchema,
]);

export type PersistedAssessmentRecord = z.infer<typeof persistedAssessmentRecordSchema>;

export const assessmentScoreSuccessResponseSchema = z.object({
  success: z.literal(true),
  assessment: assessmentDataSchema,
  result: mockReadinessResultSchema,
});

export type AssessmentScoreApiSuccess = z.infer<typeof assessmentScoreSuccessResponseSchema>;

/** Alias for client code that prefers a neutral “API response” name. */
export type AssessmentScoreApiResponse = AssessmentScoreApiSuccess;

export const assessmentScoreErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type AssessmentScoreApiErrorBody = z.infer<typeof assessmentScoreErrorResponseSchema>;

export const pendingAssessmentRecordSchema = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  assessment: assessmentDataSchema,
});
export type PendingAssessmentRecord = z.infer<typeof pendingAssessmentRecordSchema>;

export const createCheckoutSessionRequestSchema = z.object({
  assessment: assessmentDataSchema,
});
export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionRequestSchema>;

export const createCheckoutSessionSuccessSchema = z.object({
  success: z.literal(true),
  url: z.string().url(),
  sessionId: z.string(),
});
export type CreateCheckoutSessionSuccess = z.infer<typeof createCheckoutSessionSuccessSchema>;

export const createCheckoutSessionErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type CreateCheckoutSessionError = z.infer<typeof createCheckoutSessionErrorSchema>;

export const verifyCheckoutSessionRequestSchema = z.object({
  sessionId: z.string().min(1),
});
export type VerifyCheckoutSessionRequest = z.infer<typeof verifyCheckoutSessionRequestSchema>;

export const verifyCheckoutSessionSuccessSchema = z.object({
  success: z.literal(true),
  paid: z.boolean(),
  sessionId: z.string(),
});
export type VerifyCheckoutSessionSuccess = z.infer<typeof verifyCheckoutSessionSuccessSchema>;

export const verifyCheckoutSessionErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type VerifyCheckoutSessionError = z.infer<typeof verifyCheckoutSessionErrorSchema>;

export const reportDbRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  stripe_session_id: z.string(),
  payment_status: z.string(),
  full_name: z.string(),
  email: z.string(),
  lessons_taken: z.number().int(),
  test_booked: z.boolean(),
  test_date: z.string().nullable(),
  mock_test_taken: z.boolean(),
  mock_test_result: z.string(),
  serious_faults: z.number().int(),
  driving_faults: z.number().int(),
  confidence_level: z.number().int(),
  weak_areas: z.array(z.string()),
  extra_notes: z.string().nullable(),
  readiness_score: z.number().int(),
  readiness_label: z.string(),
  summary: z.string(),
  risk_areas: z.union([z.array(z.string()), z.array(groupedRiskAreaSchema)]),
  next_steps: z.array(z.string()),
  recommended_hours: z.string(),
  coach_message: z.string(),
  report_source: z.string(),
  model_name: z.string().nullable(),
  generated_at: z.string(),
  raw_metadata: z.record(z.unknown()).nullable(),
});
export type ReportDbRecord = z.infer<typeof reportDbRecordSchema>;

export const paymentDbRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  stripe_session_id: z.string(),
  stripe_payment_intent_id: z.string().nullable(),
  amount_total: z.number().int().nullable(),
  currency: z.string().nullable(),
  payment_status: z.string(),
  customer_email: z.string().nullable(),
  full_name: z.string().nullable(),
  raw_metadata: z.record(z.unknown()).nullable(),
});
export type PaymentDbRecord = z.infer<typeof paymentDbRecordSchema>;

export const finaliseReportRequestSchema = z.object({
  sessionId: z.string().min(1),
  assessment: assessmentDataSchema,
});
export type FinaliseReportRequest = z.infer<typeof finaliseReportRequestSchema>;

export const finaliseReportSuccessSchema = z.object({
  success: z.literal(true),
  assessment: assessmentDataSchema,
  result: mockReadinessResultSchema,
  reportId: z.string().uuid(),
  sessionId: z.string(),
});
export type FinaliseReportSuccess = z.infer<typeof finaliseReportSuccessSchema>;

export const finaliseReportErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type FinaliseReportError = z.infer<typeof finaliseReportErrorSchema>;

export const reportSummaryItemSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  readiness_score: z.number().int(),
  readiness_label: z.string(),
  report_source: z.string(),
});
export type ReportSummaryItem = z.infer<typeof reportSummaryItemSchema>;

export const reportsLookupRequestSchema = z.object({
  email: z.string().trim().email(),
});
export type ReportsLookupRequest = z.infer<typeof reportsLookupRequestSchema>;

export const reportsLookupSuccessSchema = z.object({
  success: z.literal(true),
  reports: z.array(reportSummaryItemSchema),
});
export type ReportsLookupSuccess = z.infer<typeof reportsLookupSuccessSchema>;

export const reportsLookupErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ReportsLookupError = z.infer<typeof reportsLookupErrorSchema>;

export const reportDetailSuccessSchema = z.object({
  success: z.literal(true),
  report: reportDbRecordSchema,
});
export type ReportDetailSuccess = z.infer<typeof reportDetailSuccessSchema>;

export const reportDetailErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ReportDetailError = z.infer<typeof reportDetailErrorSchema>;

export const analyticsOverviewSchema = z.object({
  success: z.literal(true),
  totalReports: z.number().int(),
  totalPaidSessions: z.number().int(),
  totalRevenue: z.number().int(),
  aiReportCount: z.number().int(),
  fallbackReportCount: z.number().int(),
  conversionProxyRate: z.number().nullable(),
  averageReadinessScore: z.number().nullable(),
  reportsLast7Days: z.number().int(),
  revenueLast30Days: z.number().int(),
});
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;

export const recentSalesItemSchema = z.object({
  created_at: z.string(),
  amount_total: z.number().int().nullable(),
  currency: z.string().nullable(),
  payment_status: z.string(),
  customer_email: z.string().nullable(),
  stripe_session_id: z.string(),
});
export type RecentSalesItem = z.infer<typeof recentSalesItemSchema>;

export const analyticsRecentSalesSchema = z.object({
  success: z.literal(true),
  sales: z.array(recentSalesItemSchema),
});
export type AnalyticsRecentSales = z.infer<typeof analyticsRecentSalesSchema>;
