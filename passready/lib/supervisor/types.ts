export type ParentLearnerLinkStatus = "pending" | "linked" | "revoked";

export type ParentLearnerLinkRow = {
  id: string;
  parent_user_id: string;
  learner_user_id: string | null;
  learner_email: string;
  learner_name: string | null;
  status: ParentLearnerLinkStatus;
  invitation_token: string | null;
  linked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PracticeLogRow = {
  id: string;
  parent_user_id: string;
  learner_link_id: string | null;
  practiced_on: string;
  duration_minutes: number;
  road_type: string;
  skills_practised: string[];
  confidence_rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ParentProfileRow = {
  user_id: string;
  display_name: string | null;
  updated_at: string;
};

export type SupervisorTrend = "up" | "down" | "flat";

export type SupervisorDashboardView = {
  linkedLearner: {
    linkId: string;
    name: string;
    email: string;
    status: ParentLearnerLinkStatus;
  } | null;
  latestScore: {
    learnerName: string;
    score: number;
    label: string;
    assessedAt: string;
  } | null;
  progressSummary: {
    currentScore: number | null;
    previousScore: number | null;
    improvement: number | null;
    trend: SupervisorTrend;
    reportsCompleted: number;
  };
  practiceFocus: {
    items: string[];
    estimatedMinutes: number;
  };
  syllabusProgress: {
    completionPercent: number;
    topicsCovered: number;
    topicsRemaining: number;
    categories: Array<{
      key: string;
      title: string;
      covered: number;
      total: number;
      completionPercent: number;
    }>;
  } | null;
};
