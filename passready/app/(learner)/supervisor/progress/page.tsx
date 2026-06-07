import type { Metadata } from "next";
import Link from "next/link";

import { SupervisorDisclaimers } from "@/components/supervisor/SupervisorDisclaimers";
import { deriveDeltaVsPrior } from "@/lib/dashboard/journey-insights";
import { formatCompactDateUk } from "@/lib/formatting";
import { listJourneySnapshotsByUserId } from "@/lib/server/repositories/reports-repository";
import { buildSupervisorDashboardView } from "@/lib/supervisor/build-dashboard-view";
import { requireLinkedLearnerUserId, requireParentSession } from "@/lib/server/supervisor-page-auth";

export const metadata: Metadata = {
  title: "Progress · Parent supervisor",
  description: "Track your learner's readiness trends and syllabus progress.",
};

export default async function SupervisorProgressPage() {
  const user = await requireParentSession();
  const learnerUserId = await requireLinkedLearnerUserId(user.id);
  const view = await buildSupervisorDashboardView(user.id);

  if (!learnerUserId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-brand-950">Progress</h1>
          <p className="mt-2 text-sm text-brand-600">Link your learner to see readiness trends here.</p>
        </header>
        <Link
          href="/supervisor/link-learner"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white"
        >
          Link learner
        </Link>
      </div>
    );
  }

  const snapshots = await listJourneySnapshotsByUserId(learnerUserId);
  const overallDelta = deriveDeltaVsPrior(snapshots);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-brand-950">Progress</h1>
        <p className="mt-2 text-sm text-brand-600">
          Readiness trends and syllabus roadmap for {view.linkedLearner?.name ?? "your learner"}.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Current score</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-950">
            {view.progressSummary.currentScore ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Reports</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-950">
            {view.progressSummary.reportsCompleted}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Overall change</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-950">
            {overallDelta !== null ? `${overallDelta >= 0 ? "+" : ""}${overallDelta}` : "—"}
          </p>
        </div>
      </section>

      {snapshots.length > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Readiness trend</h2>
          <ul className="mt-4 space-y-3">
            {snapshots.map((snap, index) => {
              const delta = index > 0 ? snap.readiness_score - snapshots[index - 1]!.readiness_score : null;
              return (
                <li
                  key={snap.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-50 bg-brand-50/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-950">
                      {snap.readiness_score}/100 · {snap.readiness_label}
                    </p>
                    <p className="text-xs text-brand-500">{formatCompactDateUk(snap.created_at)}</p>
                  </div>
                  {delta !== null ? (
                    <span
                      className={`text-xs font-semibold ${
                        delta > 0 ? "text-emerald-700" : delta < 0 ? "text-amber-800" : "text-brand-500"
                      }`}
                    >
                      {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "▬ 0"}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-brand-600">No reports yet.</p>
      )}

      {view.syllabusProgress ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold text-brand-950">Syllabus roadmap</h2>
            <p className="font-heading text-2xl font-semibold text-teal-800">
              {view.syllabusProgress.completionPercent}% complete
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500"
              style={{ width: `${view.syllabusProgress.completionPercent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-brand-600">
            {view.syllabusProgress.topicsCovered} covered · {view.syllabusProgress.topicsRemaining} remaining
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {view.syllabusProgress.categories.map((cat) => (
              <div key={cat.key} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-900">{cat.title}</p>
                  <p className="text-xs font-semibold text-teal-800">{cat.completionPercent}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-teal-600/80" style={{ width: `${cat.completionPercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <SupervisorDisclaimers compact />
    </div>
  );
}
