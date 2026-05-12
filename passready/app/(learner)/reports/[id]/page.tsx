import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/Button";
import { EstimatedLessonHoursBlock } from "@/components/EstimatedLessonHoursBlock";
import { ScoreRingGauge } from "@/components/learner/ScoreRingGauge";
import { ReportSummaryDebrief } from "@/components/ReportSummaryDebrief";
import { RiskAreasSection } from "@/components/RiskAreasSection";
import { LIFETIME_MEMBER_UI } from "@/lib/constants";
import {
  buildRecommendedHoursNarrative,
  computeEstimatedLessonHours,
  type EstimatedHoursInput,
  reportNarrativeSalt,
} from "@/lib/estimated-lesson-hours";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { getEffectiveLifetimeAccessByUserId } from "@/lib/server/effective-lifetime-access";
import { getReportByIdForUser } from "@/lib/server/repositories/reports-repository";
import { getServerAuthUser } from "@/lib/supabase/server";
import { migrateWeakAreaIds } from "@/lib/weak-area-migration";
import type { AssessmentPayload } from "@/lib/validation";

type Props = { params: { id: string } };

const paramsSchema = z.object({ id: z.string().uuid() });

export const metadata: Metadata = {
  title: "Your Test Ready Score report",
  description:
    "Saved Premium Test Ready Score report from Prep2Pass. Created by a DVSA-approved driving instructor; not an official DVSA product.",
};

function badgeClass(label: string) {
  if (label === "Needs More Time") return "bg-red-50 text-red-900 ring-red-200";
  if (label === "Building Consistency") return "bg-amber-50 text-amber-950 ring-amber-200";
  if (label === "Nearly Test Ready") return "bg-sky-50 text-sky-950 ring-sky-200";
  return "bg-teal-50 text-teal-950 ring-teal-200";
}

export default async function ReportDetailPage({ params }: Props) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const sessionUser = await getServerAuthUser();
  if (!sessionUser?.emailConfirmedAt) {
    redirect(`/login?next=${encodeURIComponent(`/reports/${parsed.data.id}`)}`);
  }

  const report = await getReportByIdForUser(parsed.data.id, sessionUser.id);
  if (!report) notFound();

  const riskBlocks = normalizeGroupedRiskAreas(report.risk_areas as unknown);
  const weakAreas = migrateWeakAreaIds(report.weak_areas) as AssessmentPayload["weakAreas"];
  const hoursInput: EstimatedHoursInput = {
    lessonsTaken: report.lessons_taken,
    mockTestTaken: report.mock_test_taken ? "yes" : "no",
    mockTestResult: report.mock_test_result as AssessmentPayload["mockTestResult"],
    seriousFaults: report.serious_faults,
    drivingFaults: report.driving_faults,
    weakAreas,
    confidenceLevel: report.confidence_level,
  };
  const estimatedHours = computeEstimatedLessonHours(hoursInput, report.readiness_score);
  const recommendedHoursNarrative = buildRecommendedHoursNarrative(estimatedHours, reportNarrativeSalt(report.id));

  let reportLifetimeRoute = false;
  try {
    reportLifetimeRoute = await getEffectiveLifetimeAccessByUserId(sessionUser.id);
  } catch {
    reportLifetimeRoute = false;
  }

  const formattedDate = new Date(report.created_at).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <article className="flex flex-col gap-6 pb-[9.25rem] md:pb-28">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Saved report</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-brand-950">Your readiness report</h1>
          <p className="mt-2 text-sm text-brand-600">{formattedDate}</p>
          <Link href="/my-reports" className="mt-3 inline-flex text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
            ← Reports library
          </Link>
        </header>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
            <ScoreRingGauge score={report.readiness_score} size={176} slim className="shrink-0" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Test Ready Score</p>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${badgeClass(
                    report.readiness_label,
                  )}`}
                >
                  {report.readiness_label}
                </span>
              </div>
              <p className="mt-4 text-sm text-brand-600">
                Guidance from your assessment · Not an official DVSA product.
              </p>
              <ReportSummaryDebrief className="mt-6">
                <p>{report.summary}</p>
              </ReportSummaryDebrief>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-teal-200/80 bg-teal-50/80 p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-teal-950">Coach note</h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-900">{report.coach_message}</p>
        </div>

        <RiskAreasSection blocks={riskBlocks} />

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">Action plan</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-brand-700">
            {(report.next_steps as string[]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <div className="mt-6">
            <EstimatedLessonHoursBlock hours={estimatedHours} />
          </div>
          <p className="mt-6 text-sm font-medium leading-relaxed text-brand-800">{recommendedHoursNarrative}</p>
        </div>

        {reportLifetimeRoute ? (
          <div className="rounded-2xl border border-teal-200/75 bg-teal-50/45 p-6 shadow-sm sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">{LIFETIME_MEMBER_UI.journeyInsights}</p>
            <p className="mt-3 text-sm font-semibold text-brand-950">{LIFETIME_MEMBER_UI.badge}</p>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-700">{LIFETIME_MEMBER_UI.progressRhythm}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/progress"
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-teal-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                See progress arc
              </Link>
              <Link
                href="/assessment"
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
              >
                Another checkpoint
              </Link>
            </div>
          </div>
        ) : null}
      </article>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[58] px-4 md:bottom-8 md:left-[17.5rem] md:right-0 md:px-8">
        <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-brand-100 bg-white/95 p-3 shadow-2xl backdrop-blur-lg">
          <Button href="/assessment" variant="conversion" className="min-h-[50px] w-full text-[15px]">
            Start new assessment
          </Button>
          <div className={`grid gap-2 ${reportLifetimeRoute ? "grid-cols-2" : "grid-cols-1"}`}>
            {reportLifetimeRoute ? (
              <Link
                href="/progress"
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-brand-200 bg-white text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
              >
                Track progress
              </Link>
            ) : null}
            <Link
              href="/my-reports"
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-brand-200 bg-white text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
            >
              All reports
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
