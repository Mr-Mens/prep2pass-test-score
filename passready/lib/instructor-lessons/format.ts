import type { InstructorLessonRow, InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";

export function formatLessonTime(time: string): string {
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatLessonDuration(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function lessonDateTimeValue(lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time">): number {
  return new Date(`${lesson.lesson_date}T${lesson.start_time}`).getTime();
}

export function isUpcomingLesson(lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time" | "status">): boolean {
  if (lesson.status !== "planned") return false;
  return lessonDateTimeValue(lesson) >= Date.now() - 60 * 60 * 1000;
}

export function reflectionHrefForLesson(lesson: InstructorLessonWithPupil): string | null {
  if (!lesson.linked_learner_user_id || lesson.status !== "completed") return null;
  const params = new URLSearchParams({
    learnerId: lesson.linked_learner_user_id,
    lessonDate: lesson.lesson_date,
    hours: String(Math.max(0.5, Math.round((lesson.duration_minutes / 60) * 2) / 2)),
  });
  if (lesson.lesson_focus.length > 0) params.set("topics", lesson.lesson_focus.join(","));
  return `/instructor/reflections/new?${params.toString()}`;
}
