import type { JourneySnapshot } from "@/lib/dashboard/journey-types";

export type PupilLinkStatus = "pending" | "accepted" | "declined" | "revoked";

export type PupilReportSummary = {
  id: string;
  created_at: string;
  readiness_score: number;
  readiness_label: string;
};

export type PupilRow = {
  id: string;
  instructor_user_id: string;
  pupil_name: string;
  pupil_email: string;
  linked_learner_user_id: string | null;
  link_status: PupilLinkStatus;
  link_responded_at: string | null;
  invite_token?: string;
  created_at: string;
  updated_at: string;
};

export type AppNotificationRow = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  action_type: string | null;
  action_payload: Record<string, unknown>;
  read_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type InstructorPupilInsights = {
  pupil: PupilRow;
  learner: {
    name: string;
    email: string;
    latestScore: number | null;
    latestLabel: string | null;
    reportsCompleted: number;
    lastAssessedAt: string | null;
  } | null;
  parents: Array<{
    linkId: string;
    name: string;
    email: string;
    status: string;
    practiceSessions: number;
    recentPractice: Array<{
      practicedOn: string;
      durationMinutes: number;
      roadType: string;
      confidenceRating: number;
    }>;
  }>;
  reports: PupilReportSummary[];
  journeySnapshots: JourneySnapshot[];
};
