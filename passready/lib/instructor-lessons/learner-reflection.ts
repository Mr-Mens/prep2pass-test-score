import type { InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";

export function learnerReflectionHrefForLesson(lesson: Pick<
  InstructorLessonWithPupil,
  "id" | "lesson_date" | "duration_minutes" | "lesson_focus"
>): string {
  const params = new URLSearchParams({
    lessonId: lesson.id,
    lessonDate: lesson.lesson_date,
    hours: String(Math.max(0.5, Math.round((lesson.duration_minutes / 60) * 2) / 2)),
  });
  if (lesson.lesson_focus.length > 0) params.set("topics", lesson.lesson_focus.join(","));
  return `/dashboard/reflections/new?${params.toString()}`;
}
