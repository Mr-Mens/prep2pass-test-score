"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { TopicChipField } from "@/components/reflections/TopicChipField";
import type { InstructorLessonWithPupil } from "@/lib/instructor-lessons/types";
import type { PupilRow } from "@/lib/instructor/pupil-link-types";
import {
  createInstructorLessonAction,
  updateInstructorLessonAction,
} from "@/lib/server/actions/instructor-lessons-actions";
import { SYLLABUS_TOPIC_CATALOG } from "@/lib/syllabus-topics";

const topicOptions = SYLLABUS_TOPIC_CATALOG.flatMap((category) =>
  category.items.map((item) => ({ id: item.id, label: item.label })),
);

type Props = {
  pupils: PupilRow[];
  lesson?: InstructorLessonWithPupil;
  defaultPupilId?: string;
  cancelHref: string;
  successHref: string;
};

export function InstructorLessonForm({ pupils, lesson, defaultPupilId, cancelHref, successHref }: Props) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pupilId, setPupilId] = useState(lesson?.pupil_id ?? defaultPupilId ?? pupils[0]?.id ?? "");
  const [lessonDate, setLessonDate] = useState(lesson?.lesson_date ?? today);
  const [startTime, setStartTime] = useState(lesson?.start_time ?? "09:00");
  const [durationMinutes, setDurationMinutes] = useState(String(lesson?.duration_minutes ?? 60));
  const [lessonFocus, setLessonFocus] = useState<string[]>(lesson?.lesson_focus ?? []);
  const [location, setLocation] = useState(lesson?.location ?? "");
  const [instructorNotes, setInstructorNotes] = useState(lesson?.instructor_notes ?? "");
  const [status, setStatus] = useState<InstructorLessonWithPupil["status"]>(lesson?.status ?? "planned");

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        pupilId,
        lessonDate,
        startTime: startTime.slice(0, 5),
        durationMinutes: Number(durationMinutes),
        lessonFocus,
        location: location.trim() || null,
        instructorNotes: instructorNotes.trim() || null,
        status,
      };

      const result = lesson
        ? await updateInstructorLessonAction(lesson.id, payload)
        : await createInstructorLessonAction(payload);

      if (!result.success) {
        setError(result.message);
        return;
      }
      router.push(successHref);
      router.refresh();
    } catch {
      setError("Could not save lesson.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <label className="block text-sm">
          <span className="font-semibold text-brand-900">Pupil</span>
          <select
            value={pupilId}
            onChange={(e) => setPupilId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
          >
            {pupils.map((pupil) => (
              <option key={pupil.id} value={pupil.id}>
                {pupil.pupil_name} ({pupil.pupil_email})
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-brand-900">Date</span>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-900">Start time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-semibold text-brand-900">Duration (minutes)</span>
          <input
            type="number"
            min={15}
            max={480}
            step={15}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
          />
        </label>

        <TopicChipField label="Lesson focus" options={topicOptions} selected={lessonFocus} onChange={setLessonFocus} />

        <label className="block text-sm">
          <span className="font-semibold text-brand-900">Location (optional)</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value.slice(0, 120))}
            placeholder="e.g. Home pickup, test centre car park"
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="font-semibold text-brand-900">Instructor notes (optional)</span>
          <textarea
            value={instructorNotes}
            onChange={(e) => setInstructorNotes(e.target.value.slice(0, 500))}
            rows={3}
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
            placeholder="Brief plan or reminders for this lesson"
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-brand-900">Status</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(["planned", "completed", "cancelled"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium capitalize ${
                  status === value
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-brand-200 bg-white text-brand-800"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button href={cancelHref} variant="secondary" className="min-h-[48px] flex-1">
          Cancel
        </Button>
        <Button type="button" variant="conversion" className="min-h-[48px] flex-1" disabled={busy} onClick={() => void submit()}>
          {busy ? "Saving…" : lesson ? "Save changes" : "Create lesson"}
        </Button>
      </div>
    </div>
  );
}
