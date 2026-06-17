import Link from "next/link";

import { BRAND_CTA } from "@/lib/constants";
import { formatIsoDateUk } from "@/lib/formatting";

import type { SupervisorDashboardView, SupervisorTrend } from "@/lib/supervisor/types";

function TrendBadge({ trend, delta }: { trend: SupervisorTrend; delta: number | null }) {
  if (delta === null) {
    return <span className="text-sm font-semibold text-brand-500">▬ No change yet</span>;
  }
  if (trend === "up") {
    return <span className="text-sm font-semibold text-emerald-700">▲ Improved {delta > 0 ? `(+${delta})` : ""}</span>;
  }
  if (trend === "down") {
    return (
      <span className="text-sm font-semibold text-amber-800">
        ▼ Declined ({delta})
      </span>
    );
  }
  return <span className="text-sm font-semibold text-brand-600">▬ No change</span>;
}

type Props = {
  view: SupervisorDashboardView;
};

export function SupervisorDashboardSections({ view }: Props) {
  const { linkedLearner, latestScore, progressSummary, practiceFocus, syllabusProgress } = view;

  return (
    <div className="space-y-6">
      {!linkedLearner ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Link your learner to get started</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            Connect your learner&apos;s Prep2Pass account to see their Pass Pilot, progress, and personalised
            practice guidance here.
          </p>
          <Link
            href="/supervisor/link-learner"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            {BRAND_CTA.helpLearnerGetScore}
          </Link>
        </section>
      ) : linkedLearner.status === "pending" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Waiting to connect with {linkedLearner.name}</h2>
          <p className="mt-2 text-sm text-brand-700">
            We saved {linkedLearner.email}. Progress appears automatically once that email has a Prep2Pass account with
            saved reports.
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Learner overview</p>
        <h2 className="mt-2 font-heading text-xl font-semibold text-brand-950">Latest Test Ready Score</h2>
        {latestScore ? (
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-600">{latestScore.learnerName}</p>
              <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-brand-950">
                {latestScore.score}
                <span className="text-2xl text-brand-400">/100</span>
              </p>
              <p className="mt-2 text-lg font-semibold text-teal-800">{latestScore.label}</p>
              <p className="mt-1 text-sm text-brand-500">Last score · {formatIsoDateUk(latestScore.assessedAt)}</p>
            </div>
            <Link
              href="/supervisor/reports"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50"
            >
              View reports
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-brand-600">
            No saved reports yet for {linkedLearner?.name ?? "your learner"}. {BRAND_CTA.helpLearnerGetScore} on
            Prep2Pass.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold text-brand-950">Progress summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Current score" value={progressSummary.currentScore ?? "Not yet"} />
          <StatCard label="Previous score" value={progressSummary.previousScore ?? "Not yet"} />
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm ring-1 ring-brand-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Improvement</p>
            <div className="mt-3">
              <TrendBadge trend={progressSummary.trend} delta={progressSummary.improvement} />
            </div>
          </div>
          <StatCard label="Reports completed" value={progressSummary.reportsCompleted} />
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
        <h2 className="font-heading text-lg font-semibold text-brand-950">What to practise next</h2>
        <p className="mt-1 text-sm text-brand-600">This week&apos;s focus, based on report recommendations and skill gaps.</p>
        {practiceFocus.items.length > 0 ? (
          <>
            <ul className="mt-4 space-y-2">
              {practiceFocus.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-brand-800">
                  <span className="text-teal-600" aria-hidden>
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-medium text-brand-700">
              Estimated practice time: ~{practiceFocus.estimatedMinutes} minutes across 1–2 calm sessions
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-brand-600">
            Link your learner and wait for their first saved report to see tailored practice priorities.
          </p>
        )}
        <Link
          href="/supervisor/practice-log"
          className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          Log a practice session
        </Link>
      </section>

      {syllabusProgress ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-brand-950">Syllabus progress</h2>
              <p className="mt-1 text-sm text-brand-600">Learning roadmap progress from their latest Test Ready Score.</p>
            </div>
            <p className="font-heading text-2xl font-semibold text-teal-800">{syllabusProgress.completionPercent}% complete</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all"
              style={{ width: `${syllabusProgress.completionPercent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-brand-600">
            {syllabusProgress.topicsCovered} topics covered · {syllabusProgress.topicsRemaining} remaining
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {syllabusProgress.categories.map((cat) => (
              <div key={cat.key} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-900">{cat.title}</p>
                  <p className="text-xs font-semibold text-teal-800">{cat.completionPercent}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-teal-600/80" style={{ width: `${cat.completionPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-brand-500">
                  {cat.covered} of {cat.total} topics
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/supervisor/progress"
            className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
          >
            View full progress
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm ring-1 ring-brand-50">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      <p className="mt-3 font-heading text-3xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}
