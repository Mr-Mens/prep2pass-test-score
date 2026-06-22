export const LESSON_STATUSES = ["planned", "completed", "cancelled", "reflection_pending"] as const;

export type LessonStatus = (typeof LESSON_STATUSES)[number];

export type InstructorLessonRow = {
  id: string;
  instructor_user_id: string;
  pupil_id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_focus: string[];
  location: string | null;
  status: LessonStatus;
  instructor_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InstructorLessonWithPupil = InstructorLessonRow & {
  pupil_name: string;
  pupil_email: string;
  linked_learner_user_id: string | null;
  pass_pilot_score: number | null;
};

export type PlannerGap = {
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

export type PlannerLesson = {
  id: string;
  pupilId: string;
  pupilName: string;
  lessonDate: string;
  startTime: string;
  durationMinutes: number;
  lessonFocus: string[];
  status: LessonStatus;
  location: string | null;
  passPilotScore: number | null;
  linkedLearnerUserId: string | null;
};

export type PlannerDay = {
  date: string;
  label: string;
  weekday: string;
  isToday: boolean;
  lessons: PlannerLesson[];
  gaps: PlannerGap[];
};

export type PlannerMonthCell = {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  lessonCount: number;
  previewLessons: PlannerLesson[];
};
