import type { InstructorLessonRow } from "@/lib/instructor-lessons/types";

/** Lessons are scheduled in UK local time (ADI / DVSA context). */
export const LESSON_TIME_ZONE = "Europe/London";

export function formatLessonTime(time: string): string {
  const [hourRaw, minuteRaw] = time.slice(0, 5).split(":");
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

/** Lesson booking slider bounds (15-minute steps). */
export const LESSON_DURATION_MIN_MINUTES = 30;
export const LESSON_DURATION_MAX_MINUTES = 360;
export const LESSON_DURATION_STEP_MINUTES = 15;

/** Human label for the booking slider, e.g. "1 hr 15 mins". */
export function formatLessonDurationSliderLabel(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} mins`;
  const hourLabel = hours === 1 ? "1 hr" : `${hours} hrs`;
  if (mins === 0) return hourLabel;
  return `${hourLabel} ${mins} mins`;
}

export function clampLessonDurationMinutes(value: number): number {
  const stepped =
    Math.round(value / LESSON_DURATION_STEP_MINUTES) * LESSON_DURATION_STEP_MINUTES;
  return Math.min(
    LESSON_DURATION_MAX_MINUTES,
    Math.max(LESSON_DURATION_MIN_MINUTES, stepped || LESSON_DURATION_MIN_MINUTES),
  );
}

function parseDateAndTimeParts(lessonDate: string, startTime: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} | null {
  const datePart = lessonDate.trim().slice(0, 10);
  const timePart = startTime.trim().slice(0, 5);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timePart);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return null;
  return { year, month, day, hour, minute };
}

/** Offset of `timeZone` from UTC at `utcMs`, in minutes (e.g. BST => 60). */
function getTimeZoneOffsetMinutes(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? Number.NaN);

  const asUtcGuess = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second"),
  );
  return (asUtcGuess - utcMs) / 60_000;
}

/**
 * Convert a UK calendar date + local start time to a UTC epoch ms.
 * Avoids host-TZ bugs (e.g. Vercel UTC treating "09:00" as 09:00Z).
 */
export function ukWallDateTimeToUtcMs(lessonDate: string, startTime: string): number {
  const parts = parseDateAndTimeParts(lessonDate, startTime);
  if (!parts) return Number.NaN;

  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const firstOffset = getTimeZoneOffsetMinutes(LESSON_TIME_ZONE, asUtc);
  let utcMs = asUtc - firstOffset * 60_000;

  // Second pass covers DST transition edges.
  const secondOffset = getTimeZoneOffsetMinutes(LESSON_TIME_ZONE, utcMs);
  if (secondOffset !== firstOffset) {
    utcMs = asUtc - secondOffset * 60_000;
  }
  return utcMs;
}

export function lessonDateTimeValue(lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time">): number {
  return ukWallDateTimeToUtcMs(lesson.lesson_date, lesson.start_time);
}

export function lessonEndDateTimeValue(
  lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time" | "duration_minutes">,
): number {
  const start = lessonDateTimeValue(lesson);
  if (Number.isNaN(start)) return Number.NaN;
  const duration = Number(lesson.duration_minutes);
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  return start + safeDuration * 60_000;
}

export const FUTURE_LESSON_COMPLETE_MESSAGE =
  "This lesson is still in the future. Would you like to cancel it instead?";

/** True while the lesson has not yet started (UK local schedule). */
export function isLessonInFuture(
  lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time" | "duration_minutes">,
  nowMs: number = Date.now(),
): boolean {
  const start = lessonDateTimeValue(lesson);
  if (Number.isNaN(start)) return false;
  return start > nowMs;
}

export function isUpcomingLesson(lesson: Pick<InstructorLessonRow, "lesson_date" | "start_time" | "status">): boolean {
  if (lesson.status !== "planned") return false;
  const start = lessonDateTimeValue(lesson);
  if (Number.isNaN(start)) return false;
  // Include lessons that started within the last hour so they stay visible in "Upcoming".
  return start >= Date.now() - 60 * 60 * 1000;
}
