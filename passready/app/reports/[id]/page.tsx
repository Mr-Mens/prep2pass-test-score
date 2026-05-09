import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/Button";
import { EstimatedLessonHoursBlock } from "@/components/EstimatedLessonHoursBlock";
import { ReportSummaryDebrief } from "@/components/ReportSummaryDebrief";
import { RiskAreasSection } from "@/components/RiskAreasSection";
import { Section } from "@/components/Section";
import { LIFETIME_MEMBER_UI } from "@/lib/constants";
import {
  buildRecommendedHoursNarrative,
  computeEstimatedLessonHours,
  type EstimatedHoursInput,
  reportNarrativeSalt,
} from "@/lib/estimated-lesson-hours";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
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
    reportLifetimeRoute = await getLifetimeAccessByUserId(sessionUser.id);
  } catch {
    reportLifetimeRoute = false;
  }

  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-3xl"
      eyebrow="Saved report"
      title="Your Test Ready Score report"
      subtitle={`Created ${new Date(report.created_at).toLocaleString(
        "en-GB",
      )}. Stored securely against your Prep2Pass account.`}
    >
      <div className="space-y-8">
        <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-600/90">Readiness score</p>
              <p className="mt-2 font-heading text-5xl font-semibold tabular-nums tracking-tight text-brand-950">
                {report.readiness_score}
                <span className="text-3xl font-semibold text-brand-400">/100</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass(
                report.readiness_label,
              )}`}
            >
              {report.readiness_label}
            </span>
          </div>
          <p className="mt-4 text-sm text-brand-600/90">
            Prep2Pass Test Ready Score: guidance from your assessment, built to support what you do with your driving
            instructor. Not an official DVSA product.
          </p>
          <ReportSummaryDebrief className="mt-6">
            <p>{report.summary}</p>
          </ReportSummaryDebrief>
        </div>

        <div className="rounded-2xl border border-teal-200/80 bg-teal-50/80 p-6 shadow-card ring-1 ring-teal-200/45 sm:p-8">
          <h2 className="text-lg font-semibold text-teal-950">Coach message</h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-900">{report.coach_message}</p>
        </div>

        <RiskAreasSection blocks={riskBlocks} />

        <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02] sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">Next steps</h2>
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
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-700">
              {LIFETIME_MEMBER_UI.progressRhythm} Go to milestones on your dashboard when you want the wider arc—not just this
              report.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/dashboard#driving-journey"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                {LIFETIME_MEMBER_UI.journey}
              </Link>
              <Link
                href="/assessment"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
              >
                Add another checkpoint
              </Link>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/my-reports" className="w-full sm:w-auto sm:min-w-[12rem]">
            Back to my reports
          </Button>
        </div>
      </div>
    </Section>
  );
}
