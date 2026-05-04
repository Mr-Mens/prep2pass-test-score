export type { WeakAreaId } from "./constants";

import type { GroupedRiskArea } from "./validation";

export type {
  CreateCheckoutSessionError,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionSuccess,
  AssessmentFormValues,
  AssessmentPayload,
  AssessmentScoreApiResponse,
  AssessmentScoreApiSuccess,
  DeterministicReadinessResult,
  EstimatedLessonHours,
  MockReadinessResult,
  PersistedAssessmentRecord,
  PersistedAssessmentRecordV2,
  PersistedAssessmentRecordV2Legacy,
  PendingAssessmentRecord,
  PaymentDbRecord,
  ReadinessLabel,
  ReportDbRecord,
  ReportMetadata,
  AiReadinessReport,
  StoredAssessment,
  StoredAssessmentV1,
  FinaliseReportError,
  FinaliseReportRequest,
  FinaliseReportSuccess,
  ReportsLookupRequest,
  ReportsLookupSuccess,
  ReportSummaryItem,
  ReportDetailSuccess,
  AnalyticsOverview,
  AnalyticsRecentSales,
  RecentSalesItem,
  VerifyCheckoutSessionRequest,
  VerifyCheckoutSessionError,
  VerifyCheckoutSessionSuccess,
} from "./validation";

export type { GroupedRiskArea } from "./validation";

/** Placeholder for a future persisted report row. */
export type AssessmentReport = {
  id: string;
  createdAt: string;
  readinessScore: number;
  riskAreas: GroupedRiskArea[];
  nextSteps: string[];
};
