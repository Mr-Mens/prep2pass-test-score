import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/Button";
import { PremiumReportSections } from "@/components/reports/PremiumReportSections";
import { BRAND_CTA, LIFETIME_MEMBER_UI } from "@/lib/constants";
import { buildRecommendedHoursNarrative, reportNarrativeSalt } from "@/lib/estimated-lesson-hours";
import { buildReportViewModel, type ReportViewModel } from "@/lib/report-view-model";
import { getEffectiveLifetimeAccessByUserId } from "@/lib/server/effective-lifetime-access";
import { getReportByIdForUser } from "@/lib/server/repositories/reports-repository";
import { getServerAuthUser } from "@/lib/supabase/server";
import type { AssessmentPayload } from "@/lib/validation";

type Props = { params: { id: string } };

const paramsSchema = z.object({ id: z.string().uuid() });

export const metadata: Metadata = {
  title: "Your Test Ready Score report",
  description:
    "Saved Premium Test Ready Score report from Prep2Pass. Created by a DVSA-approved driving instructor; not an official DVSA product.",
};

export default async function ReportDetailPage({ params }: Props) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const sessionUser = await getServerAuthUser();
  if (!sessionUser?.emailConfirmedAt) {
    redirect(`/login?next=${encodeURIComponent(`/reports/${parsed.data.id}`)}`);
  }

  const report = await getReportByIdForUser(parsed.data.id, sessionUser.id);
  if (!report) notFound();

  const model = buildReportViewModel({
    readinessScore: report.readiness_score,
    readinessLabel: report.readiness_label as ReportViewModel["readinessLabel"],
    summary: report.summary,
    nextSteps: report.next_steps as string[],
    riskAreasRaw: report.risk_areas,
    weakAreasRaw: report.weak_areas,
    lessonsTaken: report.lessons_taken,
    mockTestTaken: report.mock_test_taken,
    mockTestResult: report.mock_test_result as AssessmentPayload["mockTestResult"],
    seriousFaults: report.serious_faults,
    drivingFaults: report.driving_faults,
    confidenceLevel: report.confidence_level,
    testBooked: report.test_booked ? "yes" : "no",
    testDate: report.test_date,
    rawMetadata: report.raw_metadata,
    weakAreaDetailsRaw: report.weak_area_details,
  });

  const recommendedHoursNarrative = buildRecommendedHoursNarrative(
    model.estimatedHours,
    reportNarrativeSalt(report.id),
  );

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

        <PremiumReportSections
          model={model}
          recommendedHoursNarrative={recommendedHoursNarrative}
          journeySection={
            reportLifetimeRoute ? (
              <section className="rounded-2xl border border-teal-200/75 bg-teal-50/45 p-6 shadow-sm sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
                  {LIFETIME_MEMBER_UI.journeyInsights}
                </p>
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
                    {BRAND_CTA.getUpdatedScore}
                  </Link>
                </div>
              </section>
            ) : null
          }
        />
      </article>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[58] px-4 md:bottom-8 md:left-[17.5rem] md:right-0 md:px-8">
        <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-brand-100 bg-white/95 p-3 shadow-2xl backdrop-blur-lg">
          <Button href="/assessment" variant="conversion" className="min-h-[50px] w-full text-[15px]">
            {BRAND_CTA.updateMyScore}
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
