import { z } from "zod";

import { WEAK_AREA_OPTIONS } from "./constants";
import {
  groupedRiskAreaSchema,
  normalizeGroupedRiskAreas,
  riskAreaSkillSchema,
  riskSeveritySchema,
} from "./readiness-risk-areas";
import { MOCK_REFLECTION_CATEGORIES, MOCK_REFLECTION_SUB_OPTIONS } from "./mock-reflection";
import { migrateWeakAreaIds } from "./weak-area-migration";

type WeakAreaId = (typeof WEAK_AREA_OPTIONS)[number]["id"];

const weakAreaIds = WEAK_AREA_OPTIONS.map((o) => o.id) as [WeakAreaId, ...WeakAreaId[]];
const mockReflectionCategoryIds = MOCK_REFLECTION_CATEGORIES.map((o) => o.id) as [
  (typeof MOCK_REFLECTION_CATEGORIES)[number]["id"],
  ...(typeof MOCK_REFLECTION_CATEGORIES)[number]["id"][],
];
const mockReflectionSubOptionIds = MOCK_REFLECTION_SUB_OPTIONS.map((o) => o.id) as [
  (typeof MOCK_REFLECTION_SUB_OPTIONS)[number]["id"],
  ...(typeof MOCK_REFLECTION_SUB_OPTIONS)[number]["id"][],
];
const mockReflectionSubOptionCategoryById = new Map(
  MOCK_REFLECTION_SUB_OPTIONS.map((opt) => [opt.id, opt.categoryId] as const),
);

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

/** Blank or missing counts as 0 so fault fields stay optional for learners who do not have session data. */
const optionalNonNegativeIntStringField = (label: string, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null ? "" : v).trim())
    .superRefine((s, ctx) => {
      if (s === "") return;
      if (!/^\d+$/.test(s)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Use a whole number for ${label}, or leave blank` });
        return;
      }
      const n = Number.parseInt(s, 10);
      if (n > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Enter a realistic value for ${label} (max ${max})` });
      }
    })
    .transform((s) => (s === "" ? 0 : Number.parseInt(s, 10)))
    .pipe(z.number().int().min(0).max(max));

export const assessmentSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(120, "Name is too long"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .transform((s) => s.toLowerCase()),
    lessonsTaken: countedField("Enter approximate lessons", 400),
    testBooked: z.enum(["yes", "no"], {
      required_error: "Select whether your test is booked",
    }),
    testDate: z
      .string()
      .optional()
      .transform((v) => {
        if (v == null || typeof v !== "string" || v.trim() === "") return undefined;
        return v.trim();
      }),
    mockTestTaken: z.enum(["yes", "no"], {
      required_error: "Select whether you have taken a mock test",
    }),
    mockTestResult: z.enum(["pass", "fail", "not_taken"], {
      required_error: "Select a mock test outcome",
    }),
    seriousFaults: optionalNonNegativeIntStringField("Serious faults", 20),
    drivingFaults: optionalNonNegativeIntStringField("Driving faults", 30),
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
    mockReflectionCategories: z.array(z.enum(mockReflectionCategoryIds)).default([]),
    mockReflectionDetails: z.array(z.enum(mockReflectionSubOptionIds)).default([]),
    extraNotes: z
      .string()
      .trim()
      .max(250, "Keep this under 250 characters")
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

    if (data.mockReflectionDetails.length > 0) {
      const selectedCategories = new Set(data.mockReflectionCategories);
      for (const detailId of data.mockReflectionDetails) {
        const requiredCategory = mockReflectionSubOptionCategoryById.get(detailId);
        if (requiredCategory && !selectedCategories.has(requiredCategory)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Each selected detail must match a selected category",
            path: ["mockReflectionDetails"],
          });
          break;
        }
      }
    }
  });

export type AssessmentFormValues = z.input<typeof assessmentSchema>;
export type AssessmentPayload = z.output<typeof assessmentSchema>;

/** Normalised assessment as persisted (localStorage / future API). */
export const assessmentDataSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  lessonsTaken: z.number().int().min(0).max(400),
  testBooked: z.enum(["yes", "no"]),
  testDate: z
    .string()
    .optional()
    .transform((v) => {
      if (v == null || typeof v !== "string" || v.trim() === "") return undefined;
      return v.trim();
    }),
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
  mockReflectionCategories: z.array(z.enum(mockReflectionCategoryIds)).optional().default([]),
  mockReflectionDetails: z.array(z.enum(mockReflectionSubOptionIds)).optional().default([]),
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

export const readinessLabelSchema = z.enum([
  "Needs More Time",
  "Building Consistency",
  "Nearly Test Ready",
  "Test Ready",
]);

export type ReadinessLabel = z.infer<typeof readinessLabelSchema>;

export type RiskSeverity = z.infer<typeof riskSeveritySchema>;
export type GroupedRiskArea = z.infer<typeof groupedRiskAreaSchema>;
export type RiskAreaSkill = z.infer<typeof riskAreaSkillSchema>;
export { groupedRiskAreaSchema, riskAreaSkillSchema, riskSeveritySchema, normalizeGroupedRiskAreas };

const riskAreasNormalizedSchema = z
  .unknown()
  .transform((raw) => normalizeGroupedRiskAreas(raw))
  .pipe(z.array(groupedRiskAreaSchema).min(1).max(8));

/**
 * Core deterministic scoring output. Used as the base signal and fallback source of truth.
 */
export const estimatedLessonHoursSchema = z.object({
  min: z.number().int().min(0).max(120),
  max: z.number().int().min(0).max(120),
  openEndedHigh: z.boolean(),
});
export type EstimatedLessonHours = z.infer<typeof estimatedLessonHoursSchema>;

export const deterministicReadinessResultSchema = z.object({
  readinessScore: z.number().int().min(0).max(100),
  readinessLabel: readinessLabelSchema,
  riskAreas: riskAreasNormalizedSchema,
  recommendedHours: z.string(),
  summary: z.string(),
  nextSteps: z.array(z.string()),
  /** Present on new scores; optional for older persisted deterministic snapshots. */
  estimatedLessonHours: estimatedLessonHoursSchema.optional(),
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
  riskAreas: riskAreasNormalizedSchema,
  nextSteps: z.array(z.string().min(1)).min(2).max(6),
  recommendedHours: z.string().min(1),
  coachMessage: z.string().min(1),
  /** Deterministic range; optional on older cached API payloads. */
  estimatedLessonHours: estimatedLessonHoursSchema.optional(),
});
export type AiReadinessReport = z.infer<typeof aiReadinessReportSchema>;

/**
 * OpenAI JSON body: narrative fields only.
 * Score/label from the model are ignored (often wrong by one point or legacy labels); the server always uses deterministic scoring.
 */
export const aiReadinessNarrativeOnlySchema = z.object({
  summary: z.string().min(1),
  riskAreas: riskAreasNormalizedSchema,
  nextSteps: z.array(z.string().min(1)).min(2).max(6),
  coachMessage: z.string().min(1),
});
export type AiReadinessNarrativeOnly = z.infer<typeof aiReadinessNarrativeOnlySchema>;

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

export const checkoutPriceTierSchema = z.enum(["single", "lifetime"]);

export const createCheckoutSessionRequestSchema = z.object({
  assessment: assessmentDataSchema,
  tier: checkoutPriceTierSchema,
});
export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionRequestSchema>;
export type CheckoutPriceTier = z.infer<typeof checkoutPriceTierSchema>;

export const createCheckoutSessionSuccessSchema = z.discriminatedUnion("skipCheckout", [
  z.object({
    success: z.literal(true),
    skipCheckout: z.literal(true),
    entitlementToken: z.string().min(1),
  }),
  z.object({
    success: z.literal(true),
    skipCheckout: z.literal(false),
    url: z.string().url(),
    sessionId: z.string(),
  }),
]);
export type CreateCheckoutSessionSuccess = z.infer<typeof createCheckoutSessionSuccessSchema>;

export const entitlementLookupRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((s) => s.toLowerCase()),
});

export const entitlementLookupSuccessSchema = z.object({
  success: z.literal(true),
  hasLifetimeAccess: z.boolean(),
  hasPurchasedSingleReport: z.boolean(),
  reportCount: z.number().int().min(0),
});
export type EntitlementLookupSuccess = z.infer<typeof entitlementLookupSuccessSchema>;

/** Same shape as email lookup for entitlements — normalised on parse. */
export const progressRequestSchema = entitlementLookupRequestSchema;

export const progressEntrySchema = z.object({
  reportId: z.string().uuid(),
  recordedAt: z.string(),
  score: z.number().int(),
  label: z.string(),
});
export type ProgressEntry = z.infer<typeof progressEntrySchema>;

export const progressSuccessSchema = z.object({
  success: z.literal(true),
  hasLifetimeAccess: z.boolean(),
  reportCount: z.number().int().min(0),
  entries: z.array(progressEntrySchema),
});
export type ProgressSuccess = z.infer<typeof progressSuccessSchema>;

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

export const finaliseReportRequestSchema = z
  .object({
    sessionId: z.string().min(1).optional(),
    entitlementToken: z.string().min(1).optional(),
    assessment: assessmentDataSchema,
  })
  .refine(
    (d) =>
      (Boolean(d.sessionId) && !d.entitlementToken) || (!d.sessionId && Boolean(d.entitlementToken)),
    { message: "Provide either sessionId or entitlementToken" },
  );
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
