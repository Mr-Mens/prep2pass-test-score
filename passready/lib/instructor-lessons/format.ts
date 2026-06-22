import type { InstructorLessonRow } from "@/lib/instructor-lessons/types";

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

export function lessonEndDateTimeValue(
  lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time" | "duration_minutes">,
): number {
  return lessonDateTimeValue(lesson) + lesson.duration_minutes * 60_000;
}

export const FUTURE_LESSON_COMPLETE_MESSAGE =
  "This lesson is still in the future. Would you like to cancel it instead?";

export function isLessonInFuture(
  lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time" | "duration_minutes">,
): boolean {
  return lessonEndDateTimeValue(lesson) > Date.now();
}

export function isUpcomingLesson(lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time" | "status">): boolean {
  if (lesson.status !== "planned") return false;
  return lessonDateTimeValue(lesson) >= Date.now() - 60 * 60 * 1000;
}
