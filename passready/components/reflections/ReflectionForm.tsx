"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { TopicChipField } from "@/components/reflections/TopicChipField";
import { TopicConfidencePanel } from "@/components/reflections/TopicConfidencePanel";
import {
  aggregateConfidenceFromEntries,
  syncTopicConfidenceWithTopics,
  topicConfidenceMapToEntries,
  type TopicConfidenceMap,
} from "@/lib/lesson-reflections/confidence";
import { LESSON_TYPE_LABELS } from "@/lib/lesson-reflections/constants";
import type { LessonReflectionType } from "@/lib/lesson-reflections/types";

const STEP_LABELS = ["Details", "Topics", "Reflection", "Next"] as const;

type Props = {
  cancelHref: string;
  successHref: string;
  learnerUserId?: string;
  learnerOptions?: Array<{ id: string; label: string }>;
  defaultLessonType?: LessonReflectionType;
  defaultLessonDate?: string;
  defaultLessonHours?: string;
  defaultTopicsPractised?: string[];
  defaultInstructorLessonId?: string;
};

export function ReflectionForm({
  cancelHref,
  successHref,
  learnerUserId,
  learnerOptions,
  defaultLessonType = "instructor",
  defaultLessonDate,
  defaultLessonHours,
  defaultTopicsPractised,
  defaultInstructorLessonId,
}: Props) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [savedDelta, setSavedDelta] = useState<number | null>(null);

  const [selectedLearnerId, setSelectedLearnerId] = useState(learnerUserId ?? learnerOptions?.[0]?.id ?? "");
  const [lessonDate, setLessonDate] = useState(defaultLessonDate ?? today);
  const [lessonHours, setLessonHours] = useState(defaultLessonHours ?? "1");
  const [lessonType, setLessonType] = useState<LessonReflectionType>(defaultLessonType);
  const [topicsPractised, setTopicsPractised] = useState<string[]>(defaultTopicsPractised ?? []);
  const [topicConfidence, setTopicConfidence] = useState<TopicConfidenceMap>(() =>
    syncTopicConfidenceWithTopics(defaultTopicsPractised ?? [], {}),
  );
  const [strengths, setStrengths] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [difficultyNotes, setDifficultyNotes] = useState("");
  const [nextFocus, setNextFocus] = useState<string[]>([]);
  const [privatePracticePlanned, setPrivatePracticePlanned] = useState(false);

  const reflectionPreferredIds = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const id of [...topicsPractised, ...difficulties, ...strengths]) {
      if (seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
    return ordered;
  }, [topicsPractised, difficulties, strengths]);

  const nextFocusPreferredIds = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const id of [...difficulties, ...topicsPractised, ...strengths]) {
      if (seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
    return ordered;
  }, [difficulties, topicsPractised, strengths]);

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
          instructorLessonId: defaultInstructorLessonId,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!json.success) {
        setError(json.error?.message ?? "Could not save reflection.");
        return;
      }
      const { before, after } = aggregateConfidenceFromEntries(topicConfidenceEntries);
      setSavedDelta(after - before);
      window.setTimeout(() => {
        router.push(successHref);
        router.refresh();
      }, 1200);
    } catch {
      setError("Could not save reflection.");
    } finally {
      setBusy(false);
    }
  }

  if (savedDelta !== null) {
    return (
      <div className="rounded-2xl border border-teal-200/70 bg-teal-50/40 px-5 py-10 text-center sm:px-8">
        <p className="font-heading text-xl font-semibold text-brand-950">Reflection logged</p>
        <p className="mt-2 text-sm text-brand-700">
          {savedDelta === 0
            ? "Confidence held steady this lesson."
            : savedDelta > 0
              ? `Confidence up +${savedDelta} overall.`
              : `Confidence ${savedDelta} overall — useful to know what to practise.`}
        </p>
        <p className="mt-4 text-xs text-brand-500">Taking you back…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-brand-950">
            {STEP_LABELS[step - 1]}
            <span className="ml-2 font-normal text-brand-500">
              {step} of {STEP_LABELS.length}
            </span>
          </p>
          <p className="text-xs text-brand-500">Under 2 minutes</p>
        </div>
        <ol className="mt-3 flex gap-1.5" aria-label="Progress">
          {STEP_LABELS.map((label, index) => {
            const n = index + 1;
            const active = n === step;
            const done = n < step;
            return (
              <li key={label} className="min-w-0 flex-1">
                <div
                  className={`h-1.5 rounded-full ${
                    active || done ? "bg-teal-600" : "bg-brand-100"
                  }`}
                />
                <p
                  className={`mt-1.5 truncate text-[10px] font-medium ${
                    active ? "text-teal-800" : "text-brand-400"
                  }`}
                >
                  {label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {step === 1 ? (
        <section className="space-y-4 rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
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
        <section className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-950">Topics & confidence</h2>
            <p className="mt-1 text-sm text-brand-600">Pick up to 4 topics from this lesson, then rate how you felt.</p>
          </div>
          <TopicChipField
            label="Topics practised"
            grouped
            selected={topicsPractised}
            onChange={handleTopicsChange}
            max={4}
            hint="Open a category to choose topics."
            preferredIds={defaultTopicsPractised}
            preferredLabel="Suggested from your lesson"
          />
          <TopicConfidencePanel
            topics={topicsPractised}
            confidence={topicConfidence}
            onChange={updateTopicConfidence}
            maxVisible={4}
          />
          {stepError ? <p className="text-sm text-red-700">{stepError}</p> : null}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-950">What stood out?</h2>
            <p className="mt-1 text-sm text-brand-600">Start with topics from this lesson — add others if you need to.</p>
          </div>
          <TopicChipField
            label="What went well?"
            grouped
            selected={strengths}
            onChange={setStrengths}
            preferredIds={reflectionPreferredIds}
            preferredLabel="From this lesson"
          />
          <TopicChipField
            label="What was difficult?"
            grouped
            selected={difficulties}
            onChange={setDifficulties}
            preferredIds={reflectionPreferredIds}
            preferredLabel="From this lesson"
          />
          <label className="block text-sm">
            <span className="font-semibold text-brand-900">Anything else? (optional)</span>
            <textarea
              value={difficultyNotes}
              onChange={(e) => setDifficultyNotes(e.target.value.slice(0, 250))}
              rows={3}
              className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
              placeholder="A short note about the lesson…"
            />
            <p className="mt-1 text-xs text-brand-500">{difficultyNotes.length}/250</p>
          </label>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-950">Next steps</h2>
            <p className="mt-1 text-sm text-brand-600">What should the next lesson focus on?</p>
          </div>
          <TopicChipField
            label="Next lesson focus"
            grouped
            selected={nextFocus}
            onChange={setNextFocus}
            emphasis
            preferredIds={nextFocusPreferredIds}
            preferredLabel="Suggested"
            hint="Pick what to prioritise on your next drive."
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
          <Button
            type="button"
            variant="conversion"
            className="min-h-[48px] flex-1"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Saving…" : "Save reflection"}
          </Button>
        )}
      </div>
    </div>
  );
}
