import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { getReportById } from "@/lib/server/repositories/reports-repository";
import { RiskAreasSection } from "@/components/RiskAreasSection";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";

type Props = { params: { id: string } };

const paramsSchema = z.object({ id: z.string().uuid() });

export const metadata: Metadata = {
  title: "Your TestReady Score Report",
  description:
    "Saved Premium TestReady Score Report from Prep2Pass. Created by a DVSA-approved driving instructor; not an official DVSA product.",
};

function badgeClass(label: string) {
  if (label === "Not Ready") return "bg-red-50 text-red-900 ring-red-200";
  if (label === "Nearly Ready") return "bg-amber-50 text-amber-950 ring-amber-200";
  return "bg-teal-50 text-teal-950 ring-teal-200";
}

export default async function ReportDetailPage({ params }: Props) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const report = await getReportById(parsed.data.id);
  if (!report) notFound();

  const riskBlocks = normalizeGroupedRiskAreas(report.risk_areas as unknown);

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
            Source: {report.report_source}
            {report.model_name ? ` · ${report.model_name}` : ""}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-800">{report.summary}</p>
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
          <p className="mt-4 text-sm font-medium text-brand-800">Recommended hours: {report.recommended_hours}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/report-lookup" className="w-full sm:w-auto sm:min-w-[12rem]">
            Find My Report
          </Button>
        </div>
      </div>
    </Section>
  );
}
