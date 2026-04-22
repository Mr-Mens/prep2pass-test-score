import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/Section";
import { getReportSummaryByEmail } from "@/lib/server/repositories/reports-repository";
import { verifyReportAccessToken } from "@/lib/server/report-access-token";

export const metadata: Metadata = {
  title: "Your Reports",
  description: "Secure access to your saved Prep2Pass reports.",
};

type Props = {
  searchParams?: { token?: string };
};

export default async function ReportsAccessPage({ searchParams }: Props) {
  const token = searchParams?.token ?? "";
  const tokenState = verifyReportAccessToken(token);

  if (!tokenState.valid) {
    return (
      <Section className="bg-brand-50" contentClassName="max-w-3xl" eyebrow="Access link" title="Link expired or invalid">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
          Your secure link is invalid or has expired. Request a new link from report lookup.
          <div className="mt-4">
            <Link href="/report-lookup" className="font-semibold text-red-900 underline underline-offset-2">
              Request a new link
            </Link>
          </div>
        </div>
      </Section>
    );
  }

  const reports = await getReportSummaryByEmail(tokenState.email);

  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-3xl"
      eyebrow="Secure access"
      title="Your saved reports"
      subtitle="Use this secure session to open your Premium TestReady Score Reports."
    >
      {reports.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card">
          <ul className="divide-y divide-brand-100">
            {reports.map((report) => (
              <li key={report.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-950">
                    {new Date(report.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-brand-600">
                    Score {report.readiness_score} · {report.readiness_label} · {report.report_source}
                  </p>
                </div>
                <Link
                  href={`/reports/${report.id}?token=${encodeURIComponent(token)}`}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50 sm:w-auto"
                >
                  Open report
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-700">
          No reports found for this email yet.
        </div>
      )}
    </Section>
  );
}

