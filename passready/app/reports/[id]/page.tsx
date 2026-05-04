import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { getReportById } from "@/lib/server/repositories/reports-repository";
import { RiskAreasSection } from "@/components/RiskAreasSection";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { EstimatedLessonHoursBlock } from "@/components/EstimatedLessonHoursBlock";
import { ReportSummaryDebrief } from "@/components/ReportSummaryDebrief";
import {
  buildRecommendedHoursNarrative,
  computeEstimatedLessonHours,
  reportNarrativeSalt,
} from "@/lib/estimated-lesson-hours";
import { verifyReportAccessToken } from "@/lib/server/report-access-token";
import { migrateWeakAreaIds } from "@/lib/weak-area-migration";
import type { AssessmentPayload } from "@/lib/validation";

type Props = { params: { id: string }; searchParams?: { token?: string } };

const paramsSchema = z.object({ id: z.string().uuid() });

export const metadata: Metadata = {
  title: "Your TestReady Score Report",
  description:
    "Saved Premium TestReady Score Report from Prep2Pass. Created by a DVSA-approved driving instructor; not an official DVSA product.",
};

function badgeClass(label: string) {
  if (label === "Needs More Time") return "bg-red-50 text-red-900 ring-red-200";
  if (label === "Building Consistency") return "bg-amber-50 text-amber-950 ring-amber-200";
  if (label === "Nearly Test Ready") return "bg-sky-50 text-sky-950 ring-sky-200";
  return "bg-teal-50 text-teal-950 ring-teal-200";
}

export default async function ReportDetailPage({ params, searchParams }: Props) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();
  const token = searchParams?.token ?? "";
  const tokenState = verifyReportAccessToken(token);
  if (!tokenState.valid) notFound();

  const report = await getReportById(parsed.data.id);
  if (!report) notFound();
  if (report.email.toLowerCase() !== tokenState.email) notFound();

  const riskBlocks = normalizeGroupedRiskAreas(report.risk_areas as unknown);
  const weakAreas = migrateWeakAreaIds(report.weak_areas) as AssessmentPayload["weakAreas"];
  const estimatedHours = computeEstimatedLessonHours(
    {
      seriousFaults: report.serious_faults,
      drivingFaults: report.driving_faults,
      weakAreas,
    },
    report.readiness_score,
  );
  const recommendedHoursNarrative = buildRecommendedHoursNarrative(estimatedHours, reportNarrativeSalt(report.id));

  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-3xl"
      eyebrow="Saved report"
      title="Your TestReady Score Report"
      subtitle={`Created ${new Date(report.created_at).toLocaleString("en-GB")}. Pulled from your saved Prep2Pass records.`}
    >
      <div className="space-y-8">
        <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-600/90">Readiness score</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-brand-950">{report.readiness_score}</p>
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
            Prep2Pass TestReady Score: guidance from your assessment, built to support what you do with your ADI. Not an official DVSA product.
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href={`/reports/access?token=${encodeURIComponent(token)}`} className="w-full sm:w-auto sm:min-w-[12rem]">
            Back to my reports
          </Button>
        </div>
      </div>
    </Section>
  );
}
