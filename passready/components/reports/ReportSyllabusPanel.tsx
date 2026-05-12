"use client";

import type { SyllabusProgressSnapshot } from "@/lib/validation";

type Props = {
  syllabus: SyllabusProgressSnapshot;
};

export function ReportSyllabusPanel({ syllabus }: Props) {
  return (
    <section className="rounded-2xl border border-teal-200/75 bg-teal-50/40 p-5 shadow-sm sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-900">Learning roadmap</p>
      <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight text-brand-950 sm:text-xl">
        Syllabus coverage snapshot
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-700">
        You reported <span className="font-semibold text-brand-900">{syllabus.topicsCoveredCount}</span> of{" "}
        <span className="font-semibold text-brand-900">{syllabus.totalTopics}</span> practical themes touched so far ·{" "}
        <span className="tabular-nums font-semibold">{syllabus.completionPercent}%</span> checklist completeness · weighted familiarity{" "}
        <span className="tabular-nums font-semibold">{Math.round(syllabus.weightedCoverageRatio * 100)}%</span> (high-value topics
        weighted more heavily).
      </p>

      <div
        className="mt-4 h-3 overflow-hidden rounded-full bg-white/65 ring-1 ring-teal-200/55"
        role="progressbar"
        aria-valuenow={syllabus.completionPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Syllabus completion percent"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400"
          style={{ width: `${Math.min(100, syllabus.completionPercent)}%` }}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {syllabus.categoryProgress.map((c) => (
          <div key={c.key} className="rounded-xl border border-white/80 bg-white/70 p-4 shadow-inner">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-brand-950">{c.title}</p>
              <span className="shrink-0 text-[11px] font-bold tabular-nums text-teal-800">
                {c.covered}/{c.total}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-[width]"
                style={{ width: `${Math.min(100, c.completionPercent)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-brand-500">{c.completionPercent}% of this theme group</p>
          </div>
        ))}
      </div>

      {syllabus.uncoveredPriorityLabels.length > 0 ? (
        <div className="mt-8 rounded-xl border border-amber-200/85 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-900">Still to embed in practise</p>
          <ul className="mt-3 space-y-2 text-sm text-brand-800">
            {syllabus.uncoveredPriorityLabels.slice(0, 8).map((label) => (
              <li key={label} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {syllabus.nextLessonFocus.length > 0 ? (
        <div className="mt-6 rounded-xl border border-teal-200/80 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-900">Suggested near-term spotlight</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-800">
            {syllabus.nextLessonFocus.slice(0, 4).join(" · ")}
          </p>
        </div>
      ) : null}
    </section>
  );
}
