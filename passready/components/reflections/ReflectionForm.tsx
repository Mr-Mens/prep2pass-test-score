"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { TopicChipField } from "@/components/reflections/TopicChipField";
import { TopicConfidencePanel } from "@/components/reflections/TopicConfidencePanel";
import {
  syncTopicConfidenceWithTopics,
  topicConfidenceMapToEntries,
  type TopicConfidenceMap,
} from "@/lib/lesson-reflections/confidence";
import { LESSON_TYPE_LABELS } from "@/lib/lesson-reflections/constants";
import type { LessonReflectionType } from "@/lib/lesson-reflections/types";
import { SYLLABUS_TOPIC_CATALOG } from "@/lib/syllabus-topics";

const topicOptions = SYLLABUS_TOPIC_CATALOG.flatMap((category) =>
  category.items.map((item) => ({ id: item.id, label: item.label })),
);

type Props = {
  cancelHref: string;
  successHref: string;
  learnerUserId?: string;
  learnerOptions?: Array<{ id: string; label: string }>;
  defaultLessonType?: LessonReflectionType;
};

export function ReflectionForm({
  cancelHref,
  successHref,
  learnerUserId,
  learnerOptions,
  defaultLessonType = "instructor",
}: Props) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const [selectedLearnerId, setSelectedLearnerId] = useState(learnerUserId ?? learnerOptions?.[0]?.id ?? "");
  const [lessonDate, setLessonDate] = useState(today);
  const [lessonHours, setLessonHours] = useState("1");
  const [lessonType, setLessonType] = useState<LessonReflectionType>(defaultLessonType);
  const [topicsPractised, setTopicsPractised] = useState<string[]>([]);
  const [topicConfidence, setTopicConfidence] = useState<TopicConfidenceMap>({});
  const [strengths, setStrengths] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [difficultyNotes, setDifficultyNotes] = useState("");
  const [nextFocus, setNextFocus] = useState<string[]>([]);
  const [privatePracticePlanned, setPrivatePracticePlanned] = useState(false);

  function handleTopicsChange(next: string[]) {
    setTopicsPractised(next);
    setTopicConfidence((prev) => syncTopicConfidenceWithTopics(next, prev));
    setStepError(null);
  }

  function updateTopicConfidence(topicId: string, field: "before" | "after", value: number) {
    setTopicConfidence((prev) => ({
      ...prev,
      [topicId]: {
        before: field === "before" ? value : (prev[topicId]?.before ?? 3),
        after: field === "after" ? value : (prev[topicId]?.after ?? 3),
      },
    }));
  }

  function goToNextStep() {
    if (step === 2 && topicsPractised.length === 0) {
      setStepError("Select at least one topic and rate confidence for each.");
      return;
    }
    setStepError(null);
    setStep((current) => current + 1);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const topicConfidenceEntries = topicConfidenceMapToEntries(topicConfidence, topicsPractised);
      const res = await fetch("/api/lesson-reflections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerUserId: learnerOptions?.length ? selectedLearnerId : undefined,
          lessonDate,
          lessonHours: Number(lessonHours),
          lessonType,
          topicsPractised,
          topicConfidence: topicConfidenceEntries,
          strengths,
          difficulties,
          difficultyNotes: difficultyNotes.trim() || null,
          nextFocus,
          privatePracticePlanned,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!json.success) {
        setError(json.error?.message ?? "Could not save reflection.");
        return;
      }
      router.push(successHref);
      router.refresh();
    } catch {
      setError("Could not save reflection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-brand-500">
          <span>Step {step} of 4</span>
          <span>Under 2 minutes</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100">
          <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${step * 25}%` }} />
        </div>
      </div>

      {step === 1 ? (
        <section className="space-y-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Lesson details</h2>
          {learnerOptions && learnerOptions.length > 0 ? (
            <label className="block text-sm">
              <span className="font-semibold text-brand-900">Learner</span>
              <select
                value={selectedLearnerId}
                onChange={(e) => setSelectedLearnerId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
              >
                {learnerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
            <span className="font-semibold text-brand-900">Lesson length (hours)</span>
            <input
              type="number"
              min="0.5"
              max="8"
              step="0.5"
              value={lessonHours}
              onChange={(e) => setLessonHours(e.target.value)}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
            />
          </label>
          <div>
            <p className="text-sm font-semibold text-brand-900">Lesson type</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(Object.keys(LESSON_TYPE_LABELS) as LessonReflectionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLessonType(type)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                    lessonType === type
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-brand-200 bg-white text-brand-800"
                  }`}
                >
                  {LESSON_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Topics & confidence</h2>
          <TopicChipField
            label="Topics practised"
            options={topicOptions}
            selected={topicsPractised}
            onChange={handleTopicsChange}
          />
          <TopicConfidencePanel topics={topicsPractised} confidence={topicConfidence} onChange={updateTopicConfidence} />
          {stepError ? <p className="text-sm text-red-700">{stepError}</p> : null}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-brand-950">What stood out?</h2>
          <TopicChipField label="What went well?" options={topicOptions} selected={strengths} onChange={setStrengths} />
          <TopicChipField
            label="What was difficult?"
            options={topicOptions}
            selected={difficulties}
            onChange={setDifficulties}
          />
          <label className="block text-sm">
            <span className="font-semibold text-brand-900">Tell us more (optional)</span>
            <textarea
              value={difficultyNotes}
              onChange={(e) => setDifficultyNotes(e.target.value.slice(0, 250))}
              rows={3}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
              placeholder="Anything else from this lesson?"
            />
            <p className="mt-1 text-xs text-brand-500">{difficultyNotes.length}/250</p>
          </label>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Next steps</h2>
          <TopicChipField
            label="Next lesson focus"
            options={topicOptions}
            selected={nextFocus}
            onChange={setNextFocus}
            emphasis
          />
          <label className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={privatePracticePlanned}
              onChange={(e) => setPrivatePracticePlanned(e.target.checked)}
              className="h-4 w-4 rounded border-brand-300"
            />
            <span className="font-medium text-brand-900">Private practice planned before the next lesson</span>
          </label>
        </section>
      ) : null}

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {step > 1 ? (
          <Button type="button" variant="secondary" className="min-h-[48px] flex-1" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <Button href={cancelHref} variant="secondary" className="min-h-[48px] flex-1">
            Cancel
          </Button>
        )}
        {step < 4 ? (
          <Button type="button" variant="conversion" className="min-h-[48px] flex-1" onClick={goToNextStep}>
            Continue
          </Button>
        ) : (
          <Button type="button" variant="conversion" className="min-h-[48px] flex-1" disabled={busy} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save reflection"}
          </Button>
        )}
      </div>
    </div>
  );
}
