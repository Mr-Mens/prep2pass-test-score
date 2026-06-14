import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardTrajectory } from "@/components/dashboard/DashboardTrajectory";
import { ScoreRingGauge } from "@/components/learner/ScoreRingGauge";
import { deriveDeltaVsPrior } from "@/lib/dashboard/journey-insights";
import { formatCompactDateUk, formatIsoDateUk } from "@/lib/formatting";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getInstructorPupilInsights } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

type Props = { params: { pupilId: string } };

export default async function InstructorPupilDetailPage({ params }: Props) {
  const user = await requireInstructorSession();
  if (!isSupabaseConfigured()) notFound();

  const insights = await getInstructorPupilInsights(params.pupilId, user.id);
  if (!insights) notFound();

  const { pupil, learner, parents, reports, journeySnapshots } = insights;
  const delta = deriveDeltaVsPrior(journeySnapshots);
  const latest = journeySnapshots.length ? journeySnapshots[journeySnapshots.length - 1]! : null;
  const prev = journeySnapshots.length >= 2 ? journeySnapshots[journeySnapshots.length - 2]! : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/instructor/pupils" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
          ← Back to pupils
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-950 sm:text-3xl">{pupil.pupil_name}</h1>
        <p className="mt-2 text-sm text-brand-600">{pupil.pupil_email}</p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Learner progress</h2>
        {latest ? (
          <div className="mt-4">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <ScoreRingGauge score={latest.readiness_score} size={140} slim className="shrink-0" />
              <div>
                <p className="font-heading text-3xl font-semibold text-brand-950">
                  {latest.readiness_score}/100
                  <span className="ml-2 text-lg text-teal-800">{latest.readiness_label}</span>
                </p>
                <p className="mt-2 text-sm text-brand-600">
                  {learner?.reportsCompleted ?? 0} saved report{(learner?.reportsCompleted ?? 0) === 1 ? "" : "s"}
                  {learner?.lastAssessedAt ? ` · Last score ${formatIsoDateUk(learner.lastAssessedAt)}` : ""}
                </p>
                {delta !== null && delta !== 0 && prev ? (
                  <p className={`mt-3 text-sm font-semibold ${delta > 0 ? "text-emerald-700" : "text-amber-800"}`}>
                    {delta > 0 ? `+${delta} points` : `${delta} points`} vs previous report (
                    {formatCompactDateUk(prev.created_at)})
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-brand-600">No saved reports yet.</p>
        )}
      </section>

      {journeySnapshots.length >= 2 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Score arc</h2>
          <p className="mt-2 text-sm text-brand-600">Progress across saved Premium checkpoints.</p>
          <div className="mt-6 rounded-2xl border border-brand-950/60 bg-gradient-to-b from-brand-950 via-brand-950 to-[#155e59] px-4 py-5 shadow-inner shadow-black/40">
            <DashboardTrajectory
              snapshotsChrono={journeySnapshots}
              userIdForIds={pupil.linked_learner_user_id ?? pupil.id}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Individual reports</h2>
        {reports.length === 0 ? (
          <p className="mt-4 text-sm text-brand-600">No saved reports yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-100">
            {reports.map((report, index) => (
              <li key={report.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-950">
                    Report #{reports.length - index} · {formatIsoDateUk(report.created_at)}
                  </p>
                  <p className="text-sm text-brand-600">
                    Score {report.readiness_score}/100 · {report.readiness_label}
                  </p>
                </div>
                <Link
                  href={`/instructor/pupils/${pupil.id}/reports/${report.id}`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-brand-50"
                >
                  Open report
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Parents &amp; private practice</h2>
        {parents.length === 0 ? (
          <p className="mt-4 text-sm text-brand-600">No linked parent supervisors yet.</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {parents.map((parent) => (
              <li key={parent.linkId} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-brand-950">{parent.name}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-200">
                    {parent.status === "linked" ? "Linked" : "Pending"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-500">
                  {parent.practiceSessions} practice session{parent.practiceSessions === 1 ? "" : "s"} logged
                </p>
                {parent.recentPractice.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-brand-700">
                    {parent.recentPractice.map((log, i) => (
                      <li key={`${parent.linkId}-${i}`}>
                        {formatIsoDateUk(log.practicedOn)} · {log.durationMinutes} min · {log.roadType} · confidence{" "}
                        {log.confidenceRating}/5
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-brand-500">No practice sessions logged yet.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
