export const LESSON_STATUSES = ["planned", "completed", "cancelled"] as const;

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
};
