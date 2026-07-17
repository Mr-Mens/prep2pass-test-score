"use client";

import { syllabusTopicLabel } from "@/lib/syllabus-topics";
import type { TopicConfidenceMap } from "@/lib/lesson-reflections/confidence";

const CONFIDENCE_LABELS: Record<number, string> = {
  1: "Unsure",
  2: "Low",
  3: "Getting there",
  4: "Solid",
  5: "Confident",
};

type Props = {
  topics: string[];
  confidence: TopicConfidenceMap;
  onChange: (topicId: string, field: "before" | "after", value: number) => void;
  /** Soft cap for how many topics show rating controls. */
  maxVisible?: number;
};

function ConfidenceScale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-brand-700">{label}</p>
        <p className="text-xs font-medium text-brand-600">{CONFIDENCE_LABELS[value]}</p>
      </div>
      <div className="mt-2 flex gap-1.5" role="group" aria-label={label}>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-xs font-semibold tabular-nums transition ${
                active
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-brand-200 bg-white text-brand-700 hover:border-teal-300"
              }`}
              aria-pressed={active}
              aria-label={`${n}: ${CONFIDENCE_LABELS[n]}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TopicConfidencePanel({ topics, confidence, onChange, maxVisible = 4 }: Props) {
  if (topics.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-5 text-sm text-brand-600">
        Choose topics above, then rate how you felt before and after.
      </p>
    );
  }

  const visible = topics.slice(0, maxVisible);
  const hiddenCount = Math.max(0, topics.length - visible.length);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-brand-950">How did confidence change?</p>
        <p className="mt-1 text-xs text-brand-500">1 unsure → 5 confident</p>
      </div>
      <ul className="space-y-3">
        {visible.map((topicId) => {
          const entry = confidence[topicId] ?? { before: 3, after: 3 };
          const delta = entry.after - entry.before;
          return (
            <li key={topicId} className="rounded-xl border border-brand-100 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-brand-950">{syllabusTopicLabel(topicId)}</p>
                {delta !== 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      delta > 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <ConfidenceScale
                  label="Before"
                  value={entry.before}
                  onChange={(value) => onChange(topicId, "before", value)}
                />
                <ConfidenceScale
                  label="After"
                  value={entry.after}
                  onChange={(value) => onChange(topicId, "after", value)}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 ? (
        <p className="text-xs text-brand-500">
          Rating the first {maxVisible} topics for a quicker log. Extra topics stay saved without separate scores.
        </p>
      ) : null}
    </div>
  );
}
