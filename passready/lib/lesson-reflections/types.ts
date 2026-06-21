export const LESSON_REFLECTION_TYPES = ["instructor", "parent_supervisor", "private_practice"] as const;

export type LessonReflectionType = (typeof LESSON_REFLECTION_TYPES)[number];

export type TopicConfidenceEntry = {
  topicId: string;
  before: number;
  after: number;
};

export type LessonReflectionRow = {
  id: string;
  user_id: string;
  lesson_date: string;
  lesson_hours: number;
  lesson_type: LessonReflectionType;
  topics_practised: string[];
  confidence_before: number;
  confidence_after: number;
  topic_confidence: TopicConfidenceEntry[];
  strengths: string[];
  difficulties: string[];
  difficulty_notes: string | null;
  next_focus: string[];
  private_practice_planned: boolean;
  created_by: string;
  created_at: string;
};

export type ReflectionInsights = {
  repeatedWeaknesses: Array<{ topicId: string; label: string; count: number }>;
  confidenceTrend: {
    averageDelta: number;
    direction: "up" | "down" | "steady";
    summary: string;
  };
  underPractisedTopics: Array<{ topicId: string; label: string }>;
  improvingTopics: Array<{ topicId: string; label: string; count: number }>;
  highlights: string[];
};

export type ReflectionDashboardSummary = {
  totalReflections: number;
  confidenceTrend: ReflectionInsights["confidenceTrend"];
  mostPractisedTopic: { topicId: string; label: string; count: number } | null;
  mostRepeatedDifficulty: { topicId: string; label: string; count: number } | null;
  latestReflectionId: string | null;
  insights: ReflectionInsights;
};
