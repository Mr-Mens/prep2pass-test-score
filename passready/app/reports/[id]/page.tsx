import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Section } from "@/components/Section";
import { getReportById } from "@/lib/server/repositories/reports-repository";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import type { GroupedRiskArea } from "@/lib/validation";

type Props = { params: { id: string } };

const paramsSchema = z.object({ id: z.string().uuid() });

export const metadata: Metadata = {
  title: "Your TestReady Score Report",
  description: "Saved Premium TestReady Score Report from Prep2Pass.",
};

function badgeClass(label: string) {
  if (label === "Not Ready") return "bg-red-50 text-red-900 ring-red-200";
  if (label === "Nearly Ready") return "bg-amber-50 text-amber-950 ring-amber-200";
  return "bg-teal-50 text-teal-950 ring-teal-200";
}

function severityBadgeClass(severity: GroupedRiskArea["severity"]) {
  if (severity === "high") return "bg-red-50 text-red-900 ring-red-200";
  if (severity === "medium") return "bg-amber-50 text-amber-950 ring-amber-200";
  return "bg-brand-50 text-brand-800 ring-brand-200";
}

export default async function ReportDetailPage({ params }: Props) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const report = await getReportById(parsed.data.id);
  if (!report) notFound();

  const riskBlocks = normalizeGroupedRiskAreas(report.risk_areas as GroupedRiskArea[] | string[]);

  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-3xl"
      eyebrow="Saved report"
      title="Your TestReady Score Report"
      subtitle={`Created ${new Date(report.created_at).toLocaleString("en-GB")}. Pulled from your saved Prep2Pass records.`}
    >
      <div className="space-y-8">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-600">Readiness score</p>
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
          <p className="mt-4 text-sm text-brand-600">
            Source: {report.report_source}
            {report.model_name ? ` · ${report.model_name}` : ""}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-800">{report.summary}</p>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-semibold text-teal-950">Coach message</h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-900">{report.coach_message}</p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">
            Your Test Risk Areas (Based on Driving Skills Framework)
          </h2>
          <p className="mt-2 text-xs text-brand-500">
            Grouped using common practical test skill themes — not affiliated with DVSA.
          </p>
          <div className="mt-6 space-y-5">
            {riskBlocks.map((block) => (
              <div
                key={block.group}
                className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-brand-950">{block.group}</h3>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${severityBadgeClass(
                      block.severity,
                    )}`}
                  >
                    {block.severity} risk
                  </span>
                </div>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-800">
                  {block.issues.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">Next steps</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-brand-700">
            {(report.next_steps as string[]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="mt-4 text-sm font-medium text-brand-800">Recommended hours: {report.recommended_hours}</p>
        </div>

        <div className="flex gap-3">
          <Link href="/report-lookup" className="text-sm font-semibold text-brand-800 hover:text-brand-950">
            Find My Report
          </Link>
        </div>
      </div>
    </Section>
  );
}
