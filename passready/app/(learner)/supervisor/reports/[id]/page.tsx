import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RiskAreasSection } from "@/components/RiskAreasSection";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { SupervisorDisclaimers } from "@/components/supervisor/SupervisorDisclaimers";
import { formatIsoDateUk } from "@/lib/formatting";
import { getReportByIdForUser } from "@/lib/server/repositories/reports-repository";
import { requireLinkedLearnerUserId, requireParentSession } from "@/lib/server/supervisor-page-auth";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Learner report · Parent supervisor" };
}

export default async function SupervisorReportDetailPage({ params }: Props) {
  const user = await requireParentSession();
  const learnerUserId = await requireLinkedLearnerUserId(user.id);
  if (!learnerUserId) notFound();

  const report = await getReportByIdForUser(params.id, learnerUserId);
  if (!report) notFound();

  const nextSteps = (report.next_steps as string[] | undefined) ?? [];
  const riskBlocks = normalizeGroupedRiskAreas(report.risk_areas as unknown);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/supervisor/reports" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
        ← Back to reports
      </Link>

      <header className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Read-only report</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-brand-950">{report.full_name}</h1>
        <p className="mt-3 font-heading text-3xl font-semibold text-brand-950">
          {report.readiness_score}/100
          <span className="ml-2 text-lg text-teal-800">{report.readiness_label}</span>
        </p>
        <p className="mt-2 text-sm text-brand-600">{formatIsoDateUk(report.created_at)}</p>
        <p className="mt-4 text-sm leading-relaxed text-brand-700">{report.summary}</p>
      </header>

      {riskBlocks.length > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Risk areas</h2>
          <div className="mt-4">
            <RiskAreasSection blocks={riskBlocks} compact />
          </div>
        </section>
      ) : null}

      {nextSteps.length > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Recommended focus</h2>
          <ul className="mt-4 space-y-2">
            {nextSteps.map((step) => (
              <li key={step} className="flex gap-2 text-sm text-brand-700">
                <span className="text-teal-600" aria-hidden>
                  •
                </span>
                {step}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-brand-950">Coach message</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-700">{report.coach_message}</p>
      </section>

      <SupervisorDisclaimers compact />
    </div>
  );
}
