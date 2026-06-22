import {
  PLANNER_MIN_GAP_MINUTES,
  PLANNER_WORK_END_MINUTES,
  PLANNER_WORK_START_MINUTES,
} from "@/lib/instructor-lessons/constants";
import type { InstructorLessonWithPupil, PlannerDay, PlannerGap, PlannerLesson, PlannerMonthCell } from "@/lib/instructor-lessons/types";

export function timeToMinutes(time: string): number {
  const [hourRaw, minuteRaw] = time.slice(0, 5).split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return hour * 60 + minute;
}

export function minutesToTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatGapDuration(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year!, month! - 1, day);
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function weekDates(anchor: Date): string[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(start, index)));
}

export function monthGridDates(anchor: Date): string[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => toIsoDate(addDays(gridStart, index)));
}

export function toPlannerLesson(lesson: InstructorLessonWithPupil): PlannerLesson {
  return {
    id: lesson.id,
    pupilId: lesson.pupil_id,
    pupilName: lesson.pupil_name,
    lessonDate: lesson.lesson_date,
    startTime: lesson.start_time.slice(0, 5),
    durationMinutes: lesson.duration_minutes,
    lessonFocus: lesson.lesson_focus,
    status: lesson.status,
    location: lesson.location,
    passPilotScore: lesson.pass_pilot_score,
    linkedLearnerUserId: lesson.linked_learner_user_id,
  };
}

export function calculateGapsForDay(lessons: PlannerLesson[]): PlannerGap[] {
  const booked = lessons
    .filter((lesson) => lesson.status === "planned")
    .map((lesson) => ({
      start: timeToMinutes(lesson.startTime),
      end: timeToMinutes(lesson.startTime) + lesson.durationMinutes,
    }))
    .sort((a, b) => a.start - b.start);

  const gaps: PlannerGap[] = [];
  let cursor = PLANNER_WORK_START_MINUTES;

  for (const block of booked) {
    if (block.start - cursor >= PLANNER_MIN_GAP_MINUTES) {
      gaps.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(block.start),
        durationMinutes: block.start - cursor,
      });
    }
    cursor = Math.max(cursor, block.end);
  }

  if (PLANNER_WORK_END_MINUTES - cursor >= PLANNER_MIN_GAP_MINUTES) {
    gaps.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(PLANNER_WORK_END_MINUTES),
      durationMinutes: PLANNER_WORK_END_MINUTES - cursor,
    });
  }

  return gaps;
}

function dayLabel(dateIso: string, todayIso: string): { label: string; weekday: string; isToday: boolean } {
  const date = parseIsoDate(dateIso);
  const isToday = dateIso === todayIso;
  return {
    label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
    isToday,
  };
}

export function buildPlannerDay(dateIso: string, lessons: InstructorLessonWithPupil[], todayIso: string): PlannerDay {
  const dayLessons = lessons
    .filter((lesson) => lesson.lesson_date === dateIso)
    .map(toPlannerLesson)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const meta = dayLabel(dateIso, todayIso);
  return {
    date: dateIso,
    label: meta.label,
    weekday: meta.weekday,
    isToday: meta.isToday,
    lessons: dayLessons,
    gaps: calculateGapsForDay(dayLessons),
  };
}

export function buildWeekPlanner(lessons: InstructorLessonWithPupil[], anchor = new Date()): PlannerDay[] {
  const todayIso = toIsoDate(new Date());
  return weekDates(anchor).map((date) => buildPlannerDay(date, lessons, todayIso));
}

export function buildMonthPlanner(
  lessons: InstructorLessonWithPupil[],
  anchor = new Date(),
): { monthLabel: string; cells: PlannerMonthCell[] } {
  const todayIso = toIsoDate(new Date());
  const month = anchor.getMonth();
  const plannerLessons = lessons.map(toPlannerLesson);
  const byDate = new Map<string, PlannerLesson[]>();

  for (const lesson of plannerLessons) {
    const list = byDate.get(lesson.lessonDate) ?? [];
    list.push(lesson);
    byDate.set(lesson.lessonDate, list);
  }

  const cells = monthGridDates(anchor).map((date) => {
    const dayLessons = (byDate.get(date) ?? []).sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );
    return {
      date,
      inMonth: parseIsoDate(date).getMonth() === month,
      isToday: date === todayIso,
      lessonCount: dayLessons.length,
      previewLessons: dayLessons.slice(0, 3),
    };
  });

  return {
    monthLabel: anchor.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    cells,
  };
}

export function bookLessonHref(gap: PlannerGap, date: string): string {
  const params = new URLSearchParams({
    lessonDate: date,
    startTime: gap.startTime,
    durationMinutes: String(Math.min(gap.durationMinutes, 120)),
  });
  return `/instructor/lessons/new?${params.toString()}`;
}
