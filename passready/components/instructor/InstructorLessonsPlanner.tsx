"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LESSON_STATUS_META } from "@/lib/instructor-lessons/constants";
import { formatLessonDuration, formatLessonTime } from "@/lib/instructor-lessons/format";
import {
  addDays,
  bookLessonHref,
  buildMonthPlanner,
  buildPlannerDay,
  buildWeekPlanner,
  formatGapDuration,
  parseIsoDate,
  startOfWeek,
  toIsoDate,
  weekDates,
} from "@/lib/instructor-lessons/planner";
import type { PlannerDay, PlannerGap, PlannerLesson } from "@/lib/instructor-lessons/types";
import type { InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";
import { syllabusTopicLabel } from "@/lib/syllabus-topics";

type Tab = "today" | "week" | "month";

type Props = {
  lessons: InstructorLessonWithPupil[];
};

function LessonStatusBadge({ status }: { status: PlannerLesson["status"] }) {
  const meta = LESSON_STATUS_META[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function PlannerLessonCard({ lesson }: { lesson: PlannerLesson }) {
  const focusPreview = lesson.lessonFocus.slice(0, 2).map(syllabusTopicLabel).join(", ");
  const extraFocus = lesson.lessonFocus.length > 2 ? ` +${lesson.lessonFocus.length - 2}` : "";

  return (
    <Link
      href={`/instructor/lessons/${lesson.id}`}
      className="block rounded-xl border border-brand-100 bg-white p-3 shadow-sm transition hover:border-teal-200 hover:shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-brand-950">{lesson.pupilName}</p>
          <p className="mt-0.5 text-sm text-brand-600">
            {formatLessonTime(lesson.startTime)} · {formatLessonDuration(lesson.durationMinutes)}
          </p>
        </div>
        <LessonStatusBadge status={lesson.status} />
      </div>
      {focusPreview ? (
        <p className="mt-2 text-xs text-brand-600">
          {focusPreview}
          {extraFocus}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {lesson.passPilotScore != null ? (
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-900">
            Pass Pilot {lesson.passPilotScore}
          </span>
        ) : null}
        {lesson.status === "reflection_pending" ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
            Pupil reflection pending
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function GapCard({ gap, date }: { gap: PlannerGap; date: string }) {
  return (
    <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Available</p>
          <p className="mt-1 text-sm font-medium text-brand-900">
            {formatLessonTime(gap.startTime)}–{formatLessonTime(gap.endTime)}
          </p>
          <p className="text-xs text-brand-600">{formatGapDuration(gap.durationMinutes)}</p>
        </div>
      </div>
      <Link
        href={bookLessonHref(gap, date)}
        className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-700"
      >
        Book lesson
      </Link>
    </div>
  );
}

function DayCard({ day, expanded = false }: { day: PlannerDay; expanded?: boolean }) {
  const plannedCount = day.lessons.filter((lesson) => lesson.status === "planned").length;

  return (
    <section
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        day.isToday ? "border-teal-300 ring-1 ring-teal-100" : "border-brand-100"
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{day.weekday}</p>
          <p className="font-heading text-lg font-semibold text-brand-950">{day.label}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          {plannedCount} lesson{plannedCount === 1 ? "" : "s"}
        </span>
      </header>

      <div className={`mt-4 space-y-3 ${expanded ? "" : "max-h-[28rem] overflow-y-auto"}`}>
        {day.lessons.length === 0 && day.gaps.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-3 py-4 text-sm text-brand-600">
            No lessons scheduled.
          </p>
        ) : null}

        {day.lessons.map((lesson) => (
          <PlannerLessonCard key={lesson.id} lesson={lesson} />
        ))}

        {day.gaps.map((gap) => (
          <GapCard key={`${gap.startTime}-${gap.endTime}`} gap={gap} date={day.date} />
        ))}
      </div>
    </section>
  );
}

function MonthView({
  anchor,
  lessons,
  onSelectDate,
}: {
  anchor: Date;
  lessons: InstructorLessonWithPupil[];
  onSelectDate: (date: string) => void;
}) {
  const { monthLabel, cells } = useMemo(() => buildMonthPlanner(lessons, anchor), [anchor, lessons]);
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      <p className="text-center font-heading text-lg font-semibold text-brand-950">{monthLabel}</p>
      <div className="min-w-0 overflow-x-auto">
        <div className="min-w-[17.5rem]">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-brand-500">
        {weekdays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => (
          <button
            key={cell.date}
            type="button"
            onClick={() => onSelectDate(cell.date)}
            className={`min-h-[4.5rem] rounded-lg border p-1 text-left transition hover:border-teal-300 sm:min-h-[5.5rem] ${
              cell.isToday
                ? "border-teal-400 bg-teal-50/60"
                : cell.inMonth
                  ? "border-brand-100 bg-white"
                  : "border-transparent bg-brand-50/40 text-brand-400"
            }`}
          >
            <span className={`text-xs font-semibold ${cell.inMonth ? "text-brand-900" : "text-brand-400"}`}>
              {parseIsoDate(cell.date).getDate()}
            </span>
            <div className="mt-0.5 space-y-0.5">
              {cell.previewLessons.map((lesson) => (
                <p key={lesson.id} className="truncate text-[9px] leading-tight text-brand-700 sm:text-[10px]">
                  {formatLessonTime(lesson.startTime)} {lesson.pupilName.split(" ")[0]}
                </p>
              ))}
              {cell.lessonCount > 3 ? (
                <p className="text-[9px] font-semibold text-teal-800 sm:text-[10px]">+{cell.lessonCount - 3} more</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>
        </div>
      </div>
    </div>
  );
}

export function InstructorLessonsPlanner({ lessons }: Props) {
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [tab, setTab] = useState<Tab>("week");
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [viewDate, setViewDate] = useState<string | null>(null);

  const activeDayIso = viewDate ?? todayIso;
  const activeDay = useMemo(
    () => buildPlannerDay(activeDayIso, lessons, todayIso),
    [activeDayIso, lessons, todayIso],
  );
  const weekDays = useMemo(() => buildWeekPlanner(lessons, weekAnchor), [lessons, weekAnchor]);

  const weekLabel = useMemo(() => {
    const dates = weekDates(weekAnchor);
    const start = parseIsoDate(dates[0]!);
    const end = parseIsoDate(dates[6]!);
    const sameMonth = start.getMonth() === end.getMonth();
    const startText = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const endText = end.toLocaleDateString("en-GB", {
      day: "numeric",
      month: sameMonth ? undefined : "short",
    });
    return `${startText} – ${endText}`;
  }, [weekAnchor]);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-xl bg-brand-50 p-1">
        {(
          [
            ["today", "Today"],
            ["week", "Week"],
            ["month", "Month"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              if (value === "today") setViewDate(null);
            }}
            className={`min-h-[44px] flex-1 rounded-lg text-sm font-semibold transition ${
              tab === value ? "bg-white text-brand-950 shadow-sm" : "text-brand-600 hover:text-brand-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <div className="space-y-3">
          {viewDate && viewDate !== todayIso ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2 text-sm text-brand-700">
              Viewing{" "}
              <span className="font-semibold">
                {parseIsoDate(viewDate).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              .{" "}
              <button
                type="button"
                className="font-semibold text-teal-800 underline-offset-4 hover:underline"
                onClick={() => setViewDate(null)}
              >
                Back to today
              </button>
            </div>
          ) : null}
          <DayCard day={activeDay} expanded />
        </div>
      ) : null}

      {tab === "week" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setWeekAnchor((current) => addDays(current, -7))}
              className="min-h-[40px] rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              ← Prev
            </button>
            <p className="text-sm font-semibold text-brand-800">{weekLabel}</p>
            <button
              type="button"
              onClick={() => setWeekAnchor((current) => addDays(current, 7))}
              className="min-h-[40px] rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              Next →
            </button>
          </div>
          <div className="space-y-4">
            {weekDays.map((day) => (
              <DayCard key={day.date} day={day} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "month" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
              className="min-h-[40px] rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setMonthAnchor(new Date())}
              className="min-h-[40px] rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              This month
            </button>
            <button
              type="button"
              onClick={() =>
                setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }
              className="min-h-[40px] rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              Next →
            </button>
          </div>
          <MonthView
            anchor={monthAnchor}
            lessons={lessons}
            onSelectDate={(date) => {
              setViewDate(date);
              setTab("today");
            }}
          />
        </div>
      ) : null}

    </div>
  );
}
