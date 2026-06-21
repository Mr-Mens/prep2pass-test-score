import Link from "next/link";

import { Button } from "@/components/Button";
import type { ReflectionDashboardSummary } from "@/lib/lesson-reflections/types";
import { syllabusTopicLabel } from "@/lib/syllabus-topics";

type Props = {
  summary: ReflectionDashboardSummary;
  newHref?: string;
  listHref?: string;
  latestReflectionHref?: string;
};

export function LessonReflectionsSummaryCard({
  summary,
  newHref = "/dashboard/reflections/new",
  listHref = "/dashboard/reflections",
  latestReflectionHref,
}: Props) {
  const latestHref =
    latestReflectionHref ??
    (summary.latestReflectionId ? `/dashboard/reflections/${summary.latestReflectionId}` : listHref);
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Lesson Reflections</p>
          <p className="mt-2 text-sm text-brand-600">Quick post-lesson logs that feed Progress Insights.</p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-100">
          {summary.totalReflections} saved
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Confidence trend</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-800">{summary.confidenceTrend.summary}</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Most practised</p>
          <p className="mt-2 text-sm font-semibold text-brand-950">
            {summary.mostPractisedTopic?.label ?? "Log your first reflection"}
          </p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Most repeated difficulty</p>
          <p className="mt-2 text-sm font-semibold text-brand-950">
            {summary.mostRepeatedDifficulty?.label ?? "None flagged yet"}
          </p>
        </div>
      </div>

      {summary.insights.highlights[0] ? (
        <p className="mt-4 rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-sm text-teal-950">
          {summary.insights.highlights[0]}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button href={newHref} variant="conversion" className="min-h-[48px] flex-1">
          {summary.latestReflectionId ? "Add reflection" : "Start first reflection"}
        </Button>
        {summary.latestReflectionId ? (
          <Link
            href={latestHref}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Latest reflection
          </Link>
        ) : (
          <Link
            href={listHref}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            View all
          </Link>
        )}
      </div>
    </section>
  );
}

export function reflectionTopicLabels(ids: string[]): string {
  return ids.map((id) => syllabusTopicLabel(id)).join(", ");
}
