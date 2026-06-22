import Link from "next/link";

import { LESSON_STATUS_META } from "@/lib/instructor-lessons/constants";
import { formatLessonDuration, formatLessonTime, lessonDateTimeValue } from "@/lib/instructor-lessons/format";
import { bookLessonHref } from "@/lib/instructor-lessons/planner";
import type { PlannerDay, InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";

type Props = {
  today: PlannerDay;
  lessons: InstructorLessonWithPupil[];
};

function findNextLesson(lessons: InstructorLessonWithPupil[]) {
  const now = Date.now();
  return (
    lessons
      .filter((lesson) => lesson.status === "planned")
      .sort((a, b) => lessonDateTimeValue(a) - lessonDateTimeValue(b))
      .find((lesson) => lessonDateTimeValue(lesson) >= now - 30 * 60 * 1000) ?? null
  );
}

export function InstructorUpcomingLessonsCard({ today, lessons }: Props) {
  const nextLesson = findNextLesson(lessons);
  const nextGap = today.gaps[0] ?? null;
  const todayCount = today.lessons.filter((lesson) => lesson.status === "planned").length;
  const reflectionPendingCount = today.lessons.filter((lesson) => lesson.status === "reflection_pending").length;

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Today&apos;s lessons</p>
          <p className="mt-2 text-sm text-brand-600">
            {todayCount} planned today
            {reflectionPendingCount > 0 ? ` · ${reflectionPendingCount} need reflection` : ""}
          </p>
        </div>
        <Link
          href="/instructor/lessons"
          className="inline-flex min-h-[40px] items-center rounded-xl border border-brand-200 px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          Open planner
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Next lesson</p>
          {nextLesson ? (
            <Link href={`/instructor/lessons/${nextLesson.id}`} className="mt-2 block hover:underline">
              <p className="font-semibold text-brand-950">{nextLesson.pupil_name}</p>
              <p className="mt-1 text-sm text-brand-600">
                {formatLessonTime(nextLesson.start_time)} · {formatLessonDuration(nextLesson.duration_minutes)}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${LESSON_STATUS_META.planned.className}`}
              >
                Planned
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-brand-600">No upcoming lessons scheduled.</p>
          )}
        </div>

        <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Available gap</p>
          {nextGap ? (
            <>
              <p className="mt-2 text-sm font-medium text-brand-900">
                {formatLessonTime(nextGap.startTime)}–{formatLessonTime(nextGap.endTime)}
              </p>
              <Link
                href={bookLessonHref(nextGap, today.date)}
                className="mt-3 inline-flex min-h-[40px] items-center rounded-lg bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Book lesson
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-brand-600">No 45+ minute gaps left today.</p>
          )}
        </div>
      </div>
    </section>
  );
}
