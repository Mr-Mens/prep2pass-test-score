"use client";

import { roadmapStatusLabel } from "@/lib/report-insights";
import type { SyllabusProgressSnapshot } from "@/lib/validation";

type Props = {
  syllabus: SyllabusProgressSnapshot;
};

export function ReportSyllabusPanel({ syllabus }: Props) {
  const status = roadmapStatusLabel(syllabus);
  const remaining = syllabus.totalTopics - syllabus.topicsCoveredCount;

  return (
    <section className="rounded-2xl border border-teal-200/75 bg-teal-50/40 p-5 shadow-sm sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-900">Your learning roadmap</p>
      <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight text-brand-950 sm:text-xl">
        Roadmap status: {status}
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/80 bg-white/75 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Themes covered</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-brand-950">
            {syllabus.topicsCoveredCount}
            <span className="text-base font-medium text-brand-500"> / {syllabus.totalTopics}</span>
          </p>
          <p className="mt-1 text-xs text-brand-600">{remaining} remaining</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/75 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Checklist completeness</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-brand-950">{syllabus.completionPercent}%</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/75 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Weighted familiarity</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-brand-950">
            {Math.round(syllabus.weightedCoverageRatio * 100)}%
          </p>
        </div>
      </div>

      <div
        className="mt-5 h-3 overflow-hidden rounded-full bg-white/65 ring-1 ring-teal-200/55"
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
        {syllabus.categoryProgress.map((c) => {
          const low = c.completionPercent < 50;
          return (
            <div
              key={c.key}
              className={`rounded-xl border p-4 shadow-inner ${
                low ? "border-amber-200/90 bg-amber-50/50" : "border-white/80 bg-white/70"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-brand-950">{c.title}</p>
                <span
                  className={`shrink-0 text-[11px] font-bold tabular-nums ${low ? "text-amber-900" : "text-teal-800"}`}
                >
                  {c.covered}/{c.total}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
                <div
                  className={`h-full rounded-full ${low ? "bg-amber-500" : "bg-teal-500"}`}
                  style={{ width: `${Math.min(100, c.completionPercent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {syllabus.uncoveredPriorityLabels.length > 0 ? (
        <div className="mt-8 rounded-xl border border-amber-200/85 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-900">Still to build into practice</p>
          <ul className="mt-3 space-y-2 text-sm text-brand-800">
            {syllabus.uncoveredPriorityLabels.slice(0, 6).map((label) => (
              <li key={label} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
