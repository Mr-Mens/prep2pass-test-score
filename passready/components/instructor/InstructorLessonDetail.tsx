"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";
import { LESSON_STATUS_META } from "@/lib/instructor-lessons/constants";
import {
  formatLessonDuration,
  formatLessonTime,
  FUTURE_LESSON_COMPLETE_MESSAGE,
  isLessonInFuture,
} from "@/lib/instructor-lessons/format";
import type { InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";
import {
  cancelInstructorLessonAction,
  completeInstructorLessonAction,
  deleteInstructorLessonAction,
} from "@/lib/server/actions/instructor-lessons-actions";
import { formatIsoDateUk } from "@/lib/formatting";
import { syllabusTopicLabel } from "@/lib/syllabus-topics";

type Props = {
  lesson: InstructorLessonWithPupil;
};

export function InstructorLessonDetail({ lesson }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusMeta = LESSON_STATUS_META[lesson.status];
  const lessonInFuture = lesson.status === "planned" && isLessonInFuture(lesson);

  async function runAction(action: () => Promise<{ success: boolean; message?: string }>) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Lesson</p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-brand-950">{lesson.pupil_name}</h1>
            <p className="mt-2 text-sm text-brand-600">
              {formatIsoDateUk(lesson.lesson_date)} · {formatLessonTime(lesson.start_time)} ·{" "}
              {formatLessonDuration(lesson.duration_minutes)}
            </p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {lesson.pass_pilot_score != null ? (
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900">
              Pass Pilot Score {lesson.pass_pilot_score}
            </span>
          ) : null}
          {lesson.status === "reflection_pending" ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              Waiting for pupil reflection
            </span>
          ) : null}
        </div>

        {lesson.lesson_focus.length > 0 ? (
          <div className="mt-5">
            <p className="text-sm font-semibold text-brand-900">Focus topics</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {lesson.lesson_focus.map((topicId) => (
                <li key={topicId} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
                  {syllabusTopicLabel(topicId)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {lesson.location ? (
          <p className="mt-5 text-sm text-brand-700">
            <span className="font-semibold text-brand-900">Location:</span> {lesson.location}
          </p>
        ) : null}

        {lesson.instructor_notes ? (
          <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-800">
            <p className="font-semibold text-brand-900">Notes</p>
            <p className="mt-1 whitespace-pre-wrap">{lesson.instructor_notes}</p>
          </div>
        ) : null}
      </section>

      {lesson.status === "reflection_pending" && lesson.linked_learner_user_id ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-4 text-sm text-brand-800">
          Your pupil has been notified to log their lesson reflection on Pass Pilot.
        </div>
      ) : null}

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      {lessonInFuture ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p>{FUTURE_LESSON_COMPLETE_MESSAGE}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 min-h-[44px]"
            disabled={busy}
            onClick={() => void runAction(() => cancelInstructorLessonAction(lesson.id))}
          >
            Cancel lesson
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button href={`/instructor/lessons/${lesson.id}/edit`} variant="secondary" className="min-h-[48px]">
          Edit lesson
        </Button>
        {lesson.status === "planned" && !lessonInFuture ? (
          <>
            <Button
              type="button"
              variant="conversion"
              className="min-h-[48px]"
              disabled={busy}
              onClick={() => void runAction(() => completeInstructorLessonAction(lesson.id))}
            >
              Mark complete
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-[48px]"
              disabled={busy}
              onClick={() => void runAction(() => cancelInstructorLessonAction(lesson.id))}
            >
              Cancel lesson
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="min-h-[48px]"
          disabled={busy}
          onClick={() => void runAction(() => deleteInstructorLessonAction(lesson.id).then((r) => {
            if (r.success) router.push("/instructor/lessons");
            return r;
          }))}
        >
          Delete
        </Button>
      </div>

      <Link href="/instructor/lessons" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
        ← Back to lessons planner
      </Link>
    </div>
  );
}
