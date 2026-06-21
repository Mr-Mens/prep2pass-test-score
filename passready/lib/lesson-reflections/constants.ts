import type { LessonReflectionType } from "@/lib/lesson-reflections/types";

export const LESSON_TYPE_LABELS: Record<LessonReflectionType, string> = {
  instructor: "Instructor lesson",
  parent_supervisor: "Parent / Supervisor",
  private_practice: "Private practice",
};

export const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;

export const MANOEUVRE_TOPIC_IDS = [
  "parallel_parking",
  "forward_bay_parking",
  "reverse_bay_parking",
  "pull_up_on_right",
  "emergency_stop",
] as const;

export const INDEPENDENT_TOPIC_IDS = [
  "sat_nav_driving",
  "following_signs",
  "planning_ahead",
  "independent_decision_making",
] as const;
