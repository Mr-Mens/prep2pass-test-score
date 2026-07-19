import Link from "next/link";

import { Button } from "@/components/Button";
import { DashboardTrajectory } from "@/components/dashboard/DashboardTrajectory";
import { LessonReflectionsSummaryCard } from "@/components/reflections/LessonReflectionsSummaryCard";
import { ScoreRingGauge } from "@/components/learner/ScoreRingGauge";
import { BRAND_CTA, PREMIUM_MEMBER_UI, PRICING, SMART_UI } from "@/lib/constants";
import { formatIsoDateUk } from "@/lib/formatting";
import { readinessBandDisplayLabel } from "@/lib/readiness-calibration";
import type { LearnerDashboardView } from "@/lib/server/build-learner-dashboard-view";
import type { ReadinessLabel } from "@/lib/validation";

type Props = {
  view: LearnerDashboardView;
  userId: string;
};

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-teal-200/80 hover:shadow-md sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">{children}</p>
  );
}

export function LearnerDashboardHome({ view, userId }: Props) {
  const welcome = view.firstName ? `Welcome back, ${view.firstName}` : "Welcome back";

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">{welcome}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">Here&apos;s where you currently stand.</p>
      </header>

      {/* Section 1, Latest score */}
      <DashboardCard>
        <SectionLabel>Test Ready Score</SectionLabel>
        {view.latest ? (
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">
            <ScoreRingGauge score={view.latest.score} size={160} slim className="mx-auto shrink-0 lg:mx-0" />
            <div className="min-w-0 flex-1 text-center lg:text-left">
              <p className="font-heading text-5xl font-semibold tabular-nums tracking-tight text-brand-950">
                {view.latest.score}
                <span className="ml-2 text-2xl font-medium text-brand-400">/ 100</span>
              </p>
              <p className="mt-3 text-sm font-medium text-brand-700">Readiness band</p>
              <span className="mt-2 inline-flex rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-900 ring-1 ring-teal-200">
                {view.latest.bandDisplay}
              </span>
              <div className="mt-4 inline-flex rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-left">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Confidence</p>
                  <p className="mt-1 text-sm font-semibold text-brand-950">{view.latest.confidenceDisplay}</p>
                  <p className="text-xs text-brand-600">Self-rated {view.latest.confidenceLevel}/10</p>
                </div>
              </div>
              <Link
                href={`/reports/${view.latest.reportId}`}
                className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                View {SMART_UI.latestReport.toLowerCase()}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-lg font-semibold text-brand-950">Get your first Test Ready Score</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-600">
              Answer a few questions to receive your personalised score, risks, and action plan.
            </p>
            <Button href="/assessment" variant="conversion" className="mt-5 min-h-[48px]">
              {BRAND_CTA.getMyScore}
            </Button>
          </div>
        )}
      </DashboardCard>

      {/* Section 2, Progress trend */}
      {view.trend.currentScore != null ? (
        <DashboardCard>
          <SectionLabel>Progress trend</SectionLabel>
          <div className="mt-4 flex flex-wrap items-end gap-6">
            {view.trend.previousScore != null ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Previous</p>
                <p className="font-heading text-3xl font-semibold tabular-nums text-brand-800">{view.trend.previousScore}</p>
              </div>
            ) : null}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Current</p>
              <p className="font-heading text-3xl font-semibold tabular-nums text-brand-950">{view.trend.currentScore}</p>
            </div>
            {view.trend.delta != null && view.trend.delta !== 0 ? (
              <p
                className={`text-sm font-semibold ${view.trend.delta > 0 ? "text-emerald-700" : "text-amber-800"}`}
              >
                {view.trend.delta > 0 ? `+${view.trend.delta}` : view.trend.delta} improvement
              </p>
            ) : view.trend.delta === 0 ? (
              <p className="text-sm font-medium text-brand-600">Held steady</p>
            ) : null}
          </div>
          {view.snapshots.length >= 2 ? (
            <div className="mt-5 overflow-hidden rounded-xl bg-[#0f172a] p-3 sm:p-4">
              <DashboardTrajectory snapshotsChrono={view.snapshots} userIdForIds={userId} />
            </div>
          ) : null}
        </DashboardCard>
      ) : null}

      {/* Section 3, Upcoming test */}
      {view.testBooking ? (
        <DashboardCard className="border-teal-200/70 bg-teal-50/30">
          <SectionLabel>Your test date</SectionLabel>
          <p className="mt-3 font-heading text-2xl font-semibold text-brand-950">
            {formatIsoDateUk(view.testBooking.testDate)}
          </p>
          <p className="mt-2 text-sm text-brand-700">
            Days remaining:{" "}
            <span className="font-semibold tabular-nums text-brand-950">{Math.max(0, view.testBooking.daysRemaining)}</span>
          </p>
          <p className="mt-4 rounded-xl border border-teal-200/60 bg-white/80 px-4 py-3 text-sm leading-relaxed text-brand-700">
            Focus on polishing weak areas rather than learning lots of new content.
          </p>
        </DashboardCard>
      ) : null}

      {/* Section 4, Next priority */}
      {view.nextPriority ? (
        <DashboardCard className="border-amber-200/70 bg-amber-50/25">
          <SectionLabel>Next priority</SectionLabel>
          <h2 className="mt-3 text-lg font-semibold text-brand-950">{view.nextPriority.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">{view.nextPriority.detail}</p>
          {view.nextPriority.reportId ? (
            <Link
              href={`/reports/${view.nextPriority.reportId}#priorities`}
              className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
            >
              View action plan
            </Link>
          ) : null}
        </DashboardCard>
      ) : null}

      {/* Section 5, Roadmap progress */}
      {view.roadmap ? (
        <DashboardCard>
          <SectionLabel>Roadmap progress</SectionLabel>
          <p className="mt-3 font-heading text-2xl font-semibold tabular-nums text-brand-950">
            {view.roadmap.topicsCovered}/{view.roadmap.totalTopics}{" "}
            <span className="text-base font-medium text-brand-500">themes covered</span>
          </p>
          <p className="mt-1 text-sm font-medium text-brand-700">{view.roadmap.completionPercent}% complete</p>
          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-brand-100"
            role="progressbar"
            aria-valuenow={view.roadmap.completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-400"
              style={{ width: `${Math.min(100, view.roadmap.completionPercent)}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
              <p className="text-xs font-semibold text-brand-600">Completed</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-brand-950">{view.roadmap.topicsCovered}</p>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
              <p className="text-xs font-semibold text-brand-600">Remaining</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-brand-950">
                {view.roadmap.totalTopics - view.roadmap.topicsCovered}
              </p>
            </div>
          </div>
          {(view.roadmap.independentGap || view.roadmap.manoeuvreGap) && (
            <ul className="mt-4 space-y-2 text-sm text-amber-900">
              {view.roadmap.independentGap ? (
                <li className="flex gap-2 rounded-lg bg-amber-50/80 px-3 py-2 ring-1 ring-amber-200/80">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {view.roadmap.independentGap}
                </li>
              ) : null}
              {view.roadmap.manoeuvreGap ? (
                <li className="flex gap-2 rounded-lg bg-amber-50/80 px-3 py-2 ring-1 ring-amber-200/80">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {view.roadmap.manoeuvreGap}
                </li>
              ) : null}
            </ul>
          )}
        </DashboardCard>
      ) : null}

      {/* Lesson reflections */}
      <LessonReflectionsSummaryCard summary={view.reflectionSummary} />

      <DashboardCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionLabel>Mock test reports</SectionLabel>
            <p className="mt-2 text-sm text-brand-700">
              View DVSA-style mock reports your instructor shares with you in the app.
            </p>
          </div>
          <Link
            href="/mock-tests"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Open mock tests
          </Link>
        </div>
      </DashboardCard>

      {/* Section 6, Recent reports */}
      {view.recentReports.length > 0 ? (
        <DashboardCard>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionLabel>Recent reports</SectionLabel>
            <Link href="/my-reports" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
              {BRAND_CTA.viewScoreHistory}
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {view.recentReports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reports/${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 transition hover:border-teal-200 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-950">{formatIsoDateUk(r.created_at)}</p>
                    <p className="mt-0.5 text-xs text-brand-600">
                      {readinessBandDisplayLabel(r.readiness_label as ReadinessLabel, r.readiness_score)}
                    </p>
                  </div>
                  <p className="font-heading text-xl font-semibold tabular-nums text-brand-950">
                    {r.readiness_score}
                    <span className="text-sm font-medium text-brand-400">/100</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardCard>
      ) : null}

      {/* Section 7, Update score */}
      <DashboardCard className="border-teal-200/80 bg-gradient-to-br from-teal-50/80 to-white">
        <h2 className="font-heading text-xl font-semibold text-brand-950">Ready for another checkpoint?</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Run a fresh Test Ready Score when your practice has moved on.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button href="/assessment" variant="conversion" className="min-h-[52px] w-full sm:w-auto">
            {BRAND_CTA.updateMyScore}
          </Button>
          <Button href="/assessment" variant="secondary" className="min-h-[52px] w-full sm:w-auto">
            {BRAND_CTA.getUpdatedScore}
          </Button>
        </div>
      </DashboardCard>

      {/* Section 8, Journey insights */}
      {view.journeyInsights.length > 0 ? (
        <DashboardCard className="bg-brand-50/30">
          <SectionLabel>{PREMIUM_MEMBER_UI.journeyInsights}</SectionLabel>
          <ul className="mt-4 space-y-2">
            {view.journeyInsights.map((line) => (
              <li key={line} className="flex gap-2 text-sm leading-relaxed text-brand-800">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                {line}
              </li>
            ))}
          </ul>
        </DashboardCard>
      ) : null}

      {/* Subscription / upgrade */}
      {view.hasLifetimeAccess ? (
        <DashboardCard className="border-teal-200/80 bg-teal-50/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{PREMIUM_MEMBER_UI.badge}</p>
          <p className="mt-2 text-sm font-semibold text-teal-950">{PREMIUM_MEMBER_UI.unlimited}</p>
          <Link href="/progress" className="mt-3 inline-block text-sm font-semibold text-teal-900 underline-offset-4 hover:underline">
            Open progress tracking →
          </Link>
          <Link href="/graduate" className="mt-2 block text-sm font-medium text-brand-600 underline-offset-4 hover:underline">
            Passed your test? Record Graduate Mode →
          </Link>
        </DashboardCard>
      ) : (
        <DashboardCard className="border-amber-200/80 bg-amber-50/35">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-950">Subscribe</p>
          <p className="mt-2 text-sm font-semibold text-brand-950">{PRICING.subscription.label}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-brand-700">
            <li>Unlimited assessments</li>
            <li>Progress tracking</li>
            <li>{SMART_UI.reports}</li>
            <li>{SMART_UI.debriefs}</li>
            <li>{SMART_UI.insights}</li>
          </ul>
          <Link
            href="/subscribe"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Subscribe · {PRICING.subscription.display}/month
          </Link>
        </DashboardCard>
      )}
    </div>
  );
}
