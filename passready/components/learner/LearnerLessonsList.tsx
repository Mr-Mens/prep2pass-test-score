"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { LESSON_STATUS_META } from "@/lib/instructor-lessons/constants";
import { formatLessonDuration, formatLessonTime, isUpcomingLesson } from "@/lib/instructor-lessons/format";
import type { LearnerLessonView } from "@/lib/server/repositories/instructor-lessons-repository";
import { formatIsoDateUk } from "@/lib/formatting";
import { syllabusTopicLabel } from "@/lib/syllabus-topics";

type Tab = "upcoming" | "past";

type Props = {
  lessons: LearnerLessonView[];
};

function LessonCard({ lesson }: { lesson: LearnerLessonView }) {
  const statusMeta = LESSON_STATUS_META[lesson.status];
  const upcoming = isUpcomingLesson(lesson);

  return (
    <article className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">
            {lesson.instructor_name}
          </p>
          <p className="mt-1 font-semibold text-brand-950">
            {formatIsoDateUk(lesson.lesson_date)} · {formatLessonTime(lesson.start_time)} ·{" "}
            {formatLessonDuration(lesson.duration_minutes)}
          </p>
          {lesson.location ? <p className="mt-1 text-sm text-brand-600">{lesson.location}</p> : null}
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </div>

      {lesson.lesson_focus.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {lesson.lesson_focus.map((topicId) => (
            <li key={topicId} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
              {syllabusTopicLabel(topicId)}
            </li>
          ))}
        </ul>
      ) : null}

      {lesson.status === "reflection_pending" ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
          <p className="text-sm font-semibold text-amber-950">Reflection requested</p>
          <p className="mt-1 text-sm text-amber-900">
            Your instructor marked this lesson complete. Add a quick reflection to capture what you practiced.
          </p>
          <Button href="/dashboard/reflections/new" variant="secondary" className="mt-3 min-h-[44px]">
            Add reflection
          </Button>
        </div>
      ) : null}

      {upcoming ? (
        <p className="mt-4 text-sm text-teal-800">Your next lesson with {lesson.instructor_name}.</p>
      ) : null}
    </article>
  );
}

export function LearnerLessonsList({ lessons }: Props) {
  const [tab, setTab] = useState<Tab>("upcoming");

  const upcomingLessons = useMemo(
    () => lessons.filter((lesson) => lesson.status === "planned" && isUpcomingLesson(lesson)),
    [lessons],
  );
  const pastLessons = useMemo(
    () =>
      lessons.filter(
        (lesson) =>
          lesson.status === "completed" ||
          lesson.status === "reflection_pending" ||
          (lesson.status === "planned" && !isUpcomingLesson(lesson)),
      ),
    [lessons],
  );

  const visible = tab === "upcoming" ? upcomingLessons : pastLessons;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-xl border border-brand-100 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            tab === "upcoming" ? "bg-teal-600 text-white" : "text-brand-700 hover:bg-brand-50"
          }`}
        >
          Upcoming ({upcomingLessons.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            tab === "past" ? "bg-teal-600 text-white" : "text-brand-700 hover:bg-brand-50"
          }`}
        >
          Past ({pastLessons.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm">
          <p className="font-heading text-lg font-semibold text-brand-950">
            {tab === "upcoming" ? "No upcoming lessons yet" : "No past lessons yet"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            {tab === "upcoming"
              ? "When your instructor schedules lessons with you on Pass Pilot, they will appear here with date, time, focus topics and location."
              : "Completed lessons and reflection requests from your instructor will show here."}
          </p>
          {tab === "upcoming" ? (
            <p className="mt-4 text-sm text-brand-700">
              Ask your instructor to add you as a pupil using the email on your Pass Pilot account, then accept their
              invitation from your dashboard notifications.
            </p>
          ) : null}
        </section>
      ) : (
        <ul className="space-y-4">
          {visible.map((lesson) => (
            <li key={lesson.id}>
              <LessonCard lesson={lesson} />
            </li>
          ))}
        </ul>
      )}

      {lessons.some((lesson) => lesson.lesson_focus.length > 0) ? (
        <p className="text-xs text-brand-500">
          Focus topics use the DVSA syllabus areas your instructor selected when planning the lesson.
        </p>
      ) : null}
    </div>
  );
}
