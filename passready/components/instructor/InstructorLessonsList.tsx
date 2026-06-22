"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import {
  cancelInstructorLessonAction,
  completeInstructorLessonAction,
  deleteInstructorLessonAction,
} from "@/lib/server/actions/instructor-lessons-actions";
import {
  formatLessonDuration,
  formatLessonTime,
  FUTURE_LESSON_COMPLETE_MESSAGE,
  isLessonInFuture,
  isUpcomingLesson,
} from "@/lib/instructor-lessons/format";
import type { InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";
import { formatIsoDateUk } from "@/lib/formatting";
import { reflectionTopicLabels } from "@/components/reflections/LessonReflectionsSummaryCard";

type Tab = "upcoming" | "completed";

type Props = {
  lessons: InstructorLessonWithPupil[];
};

function statusBadge(status: InstructorLessonWithPupil["status"]) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  }
  if (status === "cancelled") {
    return "bg-brand-50 text-brand-700 ring-brand-200";
  }
  return "bg-teal-50 text-teal-900 ring-teal-200";
}

function LessonCard({
  lesson,
  onChanged,
}: {
  lesson: InstructorLessonWithPupil;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lessonInFuture = lesson.status === "planned" && isLessonInFuture(lesson);

  async function runAction(action: "complete" | "cancel" | "delete") {
    setBusy(action);
    setError(null);
    try {
      const result =
        action === "delete"
          ? await deleteInstructorLessonAction(lesson.id)
          : action === "complete"
            ? await completeInstructorLessonAction(lesson.id)
            : await cancelInstructorLessonAction(lesson.id);
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
        return;
      }
      onChanged();
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-brand-950">{lesson.pupil_name}</p>
          <p className="text-sm text-brand-600">
            {formatIsoDateUk(lesson.lesson_date)} · {formatLessonTime(lesson.start_time)} ·{" "}
            {formatLessonDuration(lesson.duration_minutes)}
          </p>
          {lesson.location ? <p className="mt-1 text-sm text-brand-500">{lesson.location}</p> : null}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusBadge(lesson.status)}`}>
          {lesson.status}
        </span>
      </div>

      {lesson.lesson_focus.length > 0 ? (
        <p className="mt-3 text-sm text-brand-700">
          <span className="font-semibold text-brand-900">Focus:</span> {reflectionTopicLabels(lesson.lesson_focus)}
        </p>
      ) : null}

      {lesson.instructor_notes ? (
        <p className="mt-2 text-sm leading-relaxed text-brand-600">{lesson.instructor_notes}</p>
      ) : null}

      {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      {lessonInFuture ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {FUTURE_LESSON_COMPLETE_MESSAGE}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/instructor/lessons/${lesson.id}/edit`}
          className="inline-flex min-h-[40px] items-center rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          Edit
        </Link>
        {lesson.status === "planned" ? (
          <>
            {!lessonInFuture ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-[40px] px-3 text-sm"
                disabled={busy !== null}
                onClick={() => void runAction("complete")}
              >
                {busy === "complete" ? "Saving…" : "Mark completed"}
              </Button>
            ) : null}
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void runAction("cancel")}
              className="inline-flex min-h-[40px] items-center rounded-xl border border-brand-200 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              Cancel lesson
            </button>
          </>
        ) : null}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => {
            if (window.confirm("Delete this lesson record?")) void runAction("delete");
          }}
          className="inline-flex min-h-[40px] items-center rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export function InstructorLessonsList({ lessons }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesTab =
        tab === "upcoming"
          ? lesson.status === "planned" && isUpcomingLesson(lesson)
          : lesson.status === "completed" || lesson.status === "cancelled" || (lesson.status === "planned" && !isUpcomingLesson(lesson));
      if (!matchesTab) return false;
      if (!q) return true;
      return lesson.pupil_name.toLowerCase().includes(q) || lesson.pupil_email.toLowerCase().includes(q);
    });
  }, [lessons, query, tab]);

  const sorted =
    tab === "upcoming"
      ? [...filtered].sort(
          (a, b) =>
            new Date(`${a.lesson_date}T${a.start_time}`).getTime() - new Date(`${b.lesson_date}T${b.start_time}`).getTime(),
        )
      : [...filtered].sort(
          (a, b) =>
            new Date(`${b.lesson_date}T${b.start_time}`).getTime() - new Date(`${a.lesson_date}T${a.start_time}`).getTime(),
        );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
        <label className="block text-sm">
          <span className="font-semibold text-brand-900">Search pupil</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email"
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              { id: "upcoming", label: "Upcoming" },
              { id: "completed", label: "Completed" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-semibold ${
                tab === item.id
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-brand-200 bg-white text-brand-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-brand-500">
          {sorted.length} lesson{sorted.length === 1 ? "" : "s"} in this view
        </p>
      </section>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-5 py-10 text-center text-sm text-brand-600">
          No lessons in this view yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} onChanged={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  );
}
