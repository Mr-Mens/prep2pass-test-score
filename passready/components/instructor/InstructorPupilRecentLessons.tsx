import Link from "next/link";

import {
  formatLessonDuration,
  formatLessonTime,
  reflectionHrefForLesson,
} from "@/lib/instructor-lessons/format";
import type { InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";
import { formatIsoDateUk } from "@/lib/formatting";

type Props = {
  lessons: InstructorLessonWithPupil[];
  pupilId: string;
};

export function InstructorPupilRecentLessons({ lessons, pupilId }: Props) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Recent lessons</h2>
        <Link
          href={`/instructor/lessons/new?pupilId=${pupilId}`}
          className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          Schedule lesson
        </Link>
      </div>

      {lessons.length === 0 ? (
        <p className="mt-4 text-sm text-brand-600">No lessons logged yet for this pupil.</p>
      ) : (
        <ul className="mt-4 divide-y divide-brand-100">
          {lessons.map((lesson) => {
            const reflectionHref = reflectionHrefForLesson(lesson);
            return (
              <li key={lesson.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-950">
                    {formatIsoDateUk(lesson.lesson_date)} · {formatLessonTime(lesson.start_time)} ·{" "}
                    {formatLessonDuration(lesson.duration_minutes)}
                  </p>
                  <p className="mt-0.5 text-sm capitalize text-brand-600">{lesson.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/instructor/lessons/${lesson.id}/edit`}
                    className="inline-flex min-h-[40px] items-center rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900 hover:bg-brand-50"
                  >
                    Edit
                  </Link>
                  {reflectionHref ? (
                    <Link
                      href={reflectionHref}
                      className="inline-flex min-h-[40px] items-center rounded-xl bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-700"
                    >
                      Reflection
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
