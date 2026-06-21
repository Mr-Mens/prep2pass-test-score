"use client";

import { syllabusTopicLabel } from "@/lib/syllabus-topics";
import type { TopicConfidenceMap } from "@/lib/lesson-reflections/confidence";

type Props = {
  topics: string[];
  confidence: TopicConfidenceMap;
  onChange: (topicId: string, field: "before" | "after", value: number) => void;
};

function ConfidenceSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="font-semibold text-brand-700">{label}</span>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-teal-600"
      />
      <p className="mt-1 text-center text-sm font-semibold tabular-nums text-brand-950">{value}</p>
    </label>
  );
}

export function TopicConfidencePanel({ topics, confidence, onChange }: Props) {
  if (topics.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-5 text-sm text-brand-600">
        Select topics above, then rate confidence for each one before and after the lesson.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-brand-950">Confidence by topic</p>
      <ul className="space-y-3">
        {topics.map((topicId) => {
          const entry = confidence[topicId] ?? { before: 3, after: 3 };
          const delta = entry.after - entry.before;
          return (
            <li key={topicId} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-brand-950">{syllabusTopicLabel(topicId)}</p>
                {delta !== 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      delta > 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ConfidenceSlider
                  label="Before (1–5)"
                  value={entry.before}
                  onChange={(value) => onChange(topicId, "before", value)}
                />
                <ConfidenceSlider
                  label="After (1–5)"
                  value={entry.after}
                  onChange={(value) => onChange(topicId, "after", value)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
