import type { ReactNode } from "react";

import { ScoreRingGauge } from "@/components/learner/ScoreRingGauge";
import { readinessBandStyles } from "@/lib/report-insights";
import type { ConfidenceDisplay, ReadinessBandDisplay } from "@/lib/readiness-calibration";
import type { ReadinessLabel } from "@/lib/validation";

type Props = {
  score: number;
  label: ReadinessLabel;
  bandDisplay: ReadinessBandDisplay;
  confidenceLevel: number;
  confidenceDisplay: ConfidenceDisplay;
  summary: ReactNode;
};

export function ReportReadinessSnapshot({
  score,
  label,
  bandDisplay,
  confidenceLevel,
  confidenceDisplay,
  summary,
}: Props) {
  const styles = readinessBandStyles(label);

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Your score snapshot</p>
      <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
        <ScoreRingGauge score={score} size={176} slim className={`shrink-0 ${styles.ring}`} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Test Ready Score</p>
          <p className="mt-3 font-heading text-5xl font-semibold tabular-nums tracking-tight text-brand-950 sm:text-6xl">
            {score}
            <span className="ml-2 text-2xl font-medium text-brand-500 sm:text-3xl">/ 100</span>
          </p>
          <p className="mt-4 text-sm font-medium text-brand-700">Readiness band</p>
          <div className="mt-2 flex flex-wrap justify-center sm:justify-start">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
            >
              {bandDisplay}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Confidence</p>
              <p className="mt-1 text-sm font-semibold text-brand-950">{confidenceDisplay}</p>
              <p className="mt-0.5 text-xs text-brand-600">Self-rated {confidenceLevel}/10</p>
            </div>
          </div>
          <div
            className="mt-5 h-2.5 overflow-hidden rounded-full bg-brand-100"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Test Ready Score progress"
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
          <p className="mt-4 text-sm text-brand-600">
            Guidance from your assessment · Not an official DVSA product.
          </p>
          <div className="mt-6">{summary}</div>
        </div>
      </div>
    </section>
  );
}
