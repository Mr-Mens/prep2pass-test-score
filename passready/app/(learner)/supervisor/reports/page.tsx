import type { Metadata } from "next";
import Link from "next/link";

import { SupervisorDisclaimers } from "@/components/supervisor/SupervisorDisclaimers";
import { BRAND_CTA } from "@/lib/constants";
import { formatIsoDateUk } from "@/lib/formatting";
import { getReportSummaryByUserId } from "@/lib/server/repositories/reports-repository";
import { buildSupervisorDashboardView } from "@/lib/supervisor/build-dashboard-view";
import { requireLinkedLearnerUserId, requireParentSession } from "@/lib/server/supervisor-page-auth";

export const metadata: Metadata = {
  title: "Reports · Parent supervisor",
  description: "Read-only view of your learner's Test Ready Score Reports.",
};

export default async function SupervisorReportsPage() {
  const user = await requireParentSession();
  const learnerUserId = await requireLinkedLearnerUserId(user.id);
  const view = await buildSupervisorDashboardView(user.id);

  if (!learnerUserId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-brand-950">Reports</h1>
          <p className="mt-2 text-sm text-brand-600">Link your learner to view their saved reports here.</p>
        </header>
        <Link
          href="/supervisor/link-learner"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white"
        >
          {BRAND_CTA.helpLearnerGetScore}
        </Link>
      </div>
    );
  }

  const summaries = await getReportSummaryByUserId(learnerUserId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-brand-950">Reports</h1>
        <p className="mt-2 text-sm text-brand-600">
          Read-only access to {view.linkedLearner?.name ?? "your learner"}&apos;s saved Test Ready Score Reports.
        </p>
      </header>

      {view.latestScore ? (
        <section className="rounded-2xl border border-teal-200/80 bg-teal-50/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Latest readiness</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-950">
            {view.latestScore.score}/100 · {view.latestScore.label}
          </p>
          <p className="mt-1 text-sm text-brand-600">{formatIsoDateUk(view.latestScore.assessedAt)}</p>
        </section>
      ) : null}

      {summaries.length === 0 ? (
        <p className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-brand-600">
          No saved reports yet. {BRAND_CTA.helpLearnerGetScore} on Prep2Pass.
        </p>
      ) : (
        <ul className="space-y-3">
          {summaries.map((report) => (
            <li key={report.id}>
              <Link
                href={`/supervisor/reports/${report.id}`}
                className="block rounded-2xl border border-brand-100 bg-white p-5 shadow-sm ring-1 ring-brand-50 transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-brand-950">
                      {report.readiness_score}/100 · {report.readiness_label}
                    </p>
                    <p className="mt-1 text-sm text-brand-600">{formatIsoDateUk(report.created_at)}</p>
                  </div>
                  <span className="text-sm font-semibold text-teal-800">View →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SupervisorDisclaimers compact />
    </div>
  );
}
