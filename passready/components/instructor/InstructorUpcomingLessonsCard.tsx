import Link from "next/link";

import {
  formatLessonDuration,
  formatLessonTime,
} from "@/lib/instructor-lessons/format";
import type { InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";
import { formatIsoDateUk } from "@/lib/formatting";

type Props = {
  lessons: InstructorLessonWithPupil[];
};

export function InstructorUpcomingLessonsCard({ lessons }: Props) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Upcoming lessons</p>
          <p className="mt-2 text-sm text-brand-600">Your next planned sessions at a glance.</p>
        </div>
        <Link
          href="/instructor/lessons/new"
          className="inline-flex min-h-[40px] items-center rounded-xl bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-700"
        >
          New lesson
        </Link>
      </div>

      {lessons.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-5 text-sm text-brand-600">
          No upcoming lessons scheduled.{" "}
          <Link href="/instructor/lessons" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
            Open lessons
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/instructor/lessons/${lesson.id}/edit`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 transition hover:border-teal-200 hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-brand-950">{lesson.pupil_name}</p>
                  <p className="text-sm text-brand-600">
                    {formatIsoDateUk(lesson.lesson_date)} · {formatLessonTime(lesson.start_time)} ·{" "}
                    {formatLessonDuration(lesson.duration_minutes)}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">Planned</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/instructor/lessons"
        className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
      >
        View all lessons →
      </Link>
    </section>
  );
}
