import type { Metadata } from "next";
import Link from "next/link";

import { EstimatedLessonHoursBlock } from "@/components/EstimatedLessonHoursBlock";
import { Button } from "@/components/Button";
import { ScoreRingGauge } from "@/components/learner/ScoreRingGauge";
import { LIFETIME_MEMBER_UI, PRICING, SITE } from "@/lib/constants";
import {
  deriveDeltaVsPrior,
  deriveFocusArea,
  deriveNextMilestone,
} from "@/lib/dashboard/journey-insights";
import {
  buildRecommendedHoursNarrative,
  computeEstimatedLessonHours,
  type EstimatedHoursInput,
  reportNarrativeSalt,
} from "@/lib/estimated-lesson-hours";
import { formatIsoDateUk } from "@/lib/formatting";
import { getEntitlementLookupForUser } from "@/lib/server/repositories/entitlements-repository";
import { getReportsByUserId, listJourneySnapshotsByUserId } from "@/lib/server/repositories/reports-repository";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";
import type { AssessmentPayload } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Overview",
  description: `${SITE.name}: your Test Ready Score home — readiness, reports, and next steps.`,
};

function deltaLabel(delta: number | null): { text: string; tone: string } | null {
  if (delta === null) return null;
  if (delta > 0) return { text: `Up ${delta} vs last saved report`, tone: "text-emerald-700" };
  if (delta < 0) return { text: `Down ${Math.abs(delta)} vs last saved report`, tone: "text-amber-800" };
  return { text: "Same as your last saved report", tone: "text-brand-600" };
}

export default async function LearnerDashboardPage() {
  const user = (await getServerAuthUser())!;

  let firstName = "";
  try {
    const sb = createSupabaseServerClient();
    const {
      data: { user: full },
    } = await sb.auth.getUser();
    const md = full?.user_metadata as Record<string, unknown> | undefined;
    firstName =
      (typeof md?.first_name === "string" && md.first_name.trim()) ||
      (typeof md?.firstName === "string" && md.firstName.trim()) ||
      "";
  } catch {
    /* ignore */
  }

  const [snaps, entitlements, reports] = await Promise.all([
    listJourneySnapshotsByUserId(user.id),
    getEntitlementLookupForUser(user.id),
    getReportsByUserId(user.id),
  ]);

  const latestSnap = snaps.length ? snaps[snaps.length - 1]! : null;
  const prevSnap = snaps.length >= 2 ? snaps[snaps.length - 2]! : null;
  const delta = deriveDeltaVsPrior(snaps);
  const deltaCopy = deltaLabel(delta);

  const focusCopy =
    deriveFocusArea(latestSnap) ??
    "After your next assessment, we highlight the skills that deserve the most cockpit time.";
  const nextMilestoneCopy = deriveNextMilestone(latestSnap);

  const latestReport = reports[0];
  let lessonHoursBlock: React.ReactNode = null;
  if (latestReport) {
    const weakAreas = latestReport.weak_areas as AssessmentPayload["weakAreas"];
    const hoursInput: EstimatedHoursInput = {
      lessonsTaken: latestReport.lessons_taken,
      mockTestTaken: latestReport.mock_test_taken ? "yes" : "no",
      mockTestResult: latestReport.mock_test_result as AssessmentPayload["mockTestResult"],
      seriousFaults: latestReport.serious_faults,
      drivingFaults: latestReport.driving_faults,
      weakAreas,
      confidenceLevel: latestReport.confidence_level,
    };
    const estimatedHours = computeEstimatedLessonHours(hoursInput, latestReport.readiness_score);
    const narrative = buildRecommendedHoursNarrative(estimatedHours, reportNarrativeSalt(latestReport.id));
    lessonHoursBlock = (
      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
        <EstimatedLessonHoursBlock hours={estimatedHours} />
        <p className="mt-4 text-xs leading-relaxed text-brand-600">{narrative}</p>
        <Link
          href={`/reports/${latestReport.id}`}
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          View full narrative in report
        </Link>
      </div>
    );
  }

  const welcome = firstName ? `Welcome back, ${firstName}! 👋` : "Welcome back";

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">{welcome}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Track readiness, skim saved reports, and run a fresh Test Ready Score when you are ready.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md">
        {latestSnap ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Latest Test Ready Score</p>
              {delta !== null && delta > 0 ? (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-900 ring-1 ring-emerald-200">
                  +{delta} pts
                </span>
              ) : delta !== null && delta < 0 ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-amber-950 ring-1 ring-amber-200/90">
                  {delta} pts
                </span>
              ) : null}
            </div>
            <div className="mt-5 flex flex-col items-center gap-6 lg:flex-row lg:items-start">
              <ScoreRingGauge score={latestSnap.readiness_score} className="lg:translate-y-0.5" />
              <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-2 lg:justify-start">
                  <div>
                    <p className="font-heading text-4xl font-semibold tabular-nums tracking-tight text-brand-950 sm:text-5xl">
                      {latestSnap.readiness_score}
                      <span className="text-2xl font-semibold text-brand-400 sm:text-3xl">/100</span>
                    </p>
                  </div>
                  {prevSnap ? (
                    <div className="pb-0.5 text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Previous</p>
                      <p className="font-heading text-xl font-semibold tabular-nums text-brand-800">{prevSnap.readiness_score}</p>
                    </div>
                  ) : null}
                </div>
                <span className="inline-flex rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-900 ring-1 ring-teal-200">
                  {latestSnap.readiness_label}
                </span>
                {deltaCopy ? (
                  <p className={`max-w-lg text-sm font-medium leading-relaxed ${deltaCopy.tone}`}>{deltaCopy.text}</p>
                ) : snaps.length >= 3 ? (
                  <p className="max-w-lg text-sm font-medium leading-relaxed text-brand-600">
                    {snaps.length} saved reports logged on this account.
                  </p>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Your Test Ready Score</p>
            <p className="mt-3 text-lg font-semibold text-brand-950">Run your first assessment</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-600">
              A short questionnaire leads to checkout, then your personalised Premium report is saved here.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/assessment" variant="conversion" className="min-h-[52px] w-full flex-1 sm:w-auto">
            Check my test readiness
          </Button>
          <Link
            href="/my-reports"
            className="inline-flex min-h-[52px] w-full flex-1 items-center justify-center rounded-2xl border border-brand-100 bg-white px-6 text-base font-semibold text-brand-900 shadow-sm transition hover:border-teal-200 hover:shadow-md sm:w-auto"
          >
            View my reports
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Next focus area</p>
          <p className="mt-4 text-sm leading-relaxed text-brand-800">{focusCopy}</p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Priority</p>
          <p className="mt-4 text-sm leading-relaxed text-brand-800">{nextMilestoneCopy}</p>
          {latestSnap?.created_at ? (
            <p className="mt-4 text-[11px] text-brand-500">Based on your report dated {formatIsoDateUk(latestSnap.created_at)}.</p>
          ) : null}
        </div>
      </div>

      {lessonHoursBlock}

      {entitlements.hasLifetimeAccess ? (
        <div className="rounded-2xl border border-teal-200/80 bg-teal-50/50 p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{LIFETIME_MEMBER_UI.badge}</p>
          <p className="mt-2 text-sm font-semibold text-teal-950">{LIFETIME_MEMBER_UI.unlimited}</p>
          <p className="mt-3 text-sm leading-relaxed text-brand-700">
            {LIFETIME_MEMBER_UI.journeyInsights} Open <Link href="/progress" className="font-semibold text-teal-900 underline-offset-4 hover:underline">Progress</Link> for your arc across every saved Premium report.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-sm transition hover:border-amber-300/90 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-950">Lifetime access</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-800">
            Upgrade once for unlimited saved reports — {PRICING.lifetime.display} — billed securely through Stripe.
          </p>
          <Link
            href="/upgrade"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Upgrade to lifetime
          </Link>
        </div>
      )}

      {entitlements.hasLifetimeAccess && snaps.length > 1 ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-5 text-center shadow-sm transition hover:border-teal-200 hover:shadow-md">
          <p className="text-sm text-brand-600">
            Want timeline detail?{" "}
            <Link href="/progress" className="font-semibold text-teal-900 underline-offset-4 hover:underline">
              View progress across reports
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
