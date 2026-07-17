import Link from "next/link";

import type { ReflectionDashboardSummary, ReflectionInsights } from "@/lib/lesson-reflections/types";

type Props = {
  summary: ReflectionDashboardSummary;
  insights: ReflectionInsights;
  insightsHref?: string;
};

export function ReflectionInsightsStrip({ summary, insights, insightsHref }: Props) {
  const { direction, averageDelta, summary: trendLabel } = insights.confidenceTrend;
  const hasData = trendLabel !== "Log a lesson to start";
  const takeaway = insights.highlights[0] ?? null;

  const badgeClass =
    !hasData
      ? "bg-brand-50 text-brand-700 ring-brand-200"
      : direction === "up"
        ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
        : direction === "down"
          ? "bg-amber-50 text-amber-950 ring-amber-200"
          : "bg-brand-50 text-brand-800 ring-brand-200";

  return (
    <section className="rounded-2xl border border-brand-100 bg-white px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass}`}>
            {hasData ? `Confidence ${trendLabel.toLowerCase()}` : trendLabel}
          </span>
          {hasData ? (
            <span className="text-xs tabular-nums text-brand-500">
              {averageDelta > 0 ? "+" : ""}
              {averageDelta.toFixed(1)} avg
            </span>
          ) : null}
          {takeaway ? (
            <>
              <span className="hidden text-brand-300 sm:inline" aria-hidden>
                ·
              </span>
              <p className="w-full text-sm font-medium text-brand-900 sm:w-auto">{takeaway}</p>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs tabular-nums text-brand-500">{summary.totalReflections} logged</span>
          {insightsHref ? (
            <Link href={insightsHref} className="text-xs font-semibold text-teal-800 underline-offset-2 hover:underline">
              Details
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
