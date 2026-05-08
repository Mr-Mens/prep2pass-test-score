import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { formatIsoDateUk } from "@/lib/formatting";
import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { getReportSummaryByUserId, listScoreHistoryByUserId } from "@/lib/server/repositories/reports-repository";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Progress dashboard",
  description: "Your Test Ready Score timeline and progress history with Prep2Pass lifetime access.",
};

export default async function ProgressDashboardPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent("/dashboard")}`);
  }

  const lifetimeFlag = await getLifetimeAccessByUserId(user.id);
  if (!lifetimeFlag) {
    redirect("/my-reports");
  }

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

  const greeting = firstName || "Welcome back";

  const [summaries, timelineRows] = await Promise.all([
    getReportSummaryByUserId(user.id),
    listScoreHistoryByUserId(user.id),
  ]);

  const latest = summaries[0];

  return (
    <Section className="bg-brand-50" contentClassName="max-w-3xl">
      <div className="mb-10 rounded-2xl border border-brand-200/70 bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Progress dashboard</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          {greeting}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-600">
          Lifetime access unlocks dated score history whenever you generate a Premium report. Manage individual PDF-style
          views from{" "}
          <Link href="/my-reports" className="font-semibold text-teal-900 underline-offset-4 hover:underline">
            My reports
          </Link>
          .
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button href="/assessment" variant="conversion" className="w-full sm:w-auto sm:min-w-[12rem]">
            Start a new assessment
          </Button>
          <Button href="/my-reports" variant="secondary" className="w-full sm:w-auto">
            Saved reports
          </Button>
        </div>

        {latest ? (
          <dl className="mt-8 grid gap-4 border-t border-brand-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">Latest score</dt>
              <dd className="mt-1 text-sm font-medium text-brand-900 tabular-nums">
                {latest.readiness_score}/100 · {latest.readiness_label}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">Last report</dt>
              <dd className="mt-1 text-sm font-medium text-brand-900">{formatIsoDateUk(latest.created_at)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-8 border-t border-brand-100 pt-6 text-sm text-brand-700">
            Generate your first Premium report to start your timeline — head to{" "}
            <Link href="/my-reports" className="font-semibold text-teal-900 underline-offset-4 hover:underline">
              My reports
            </Link>{" "}
            after checkout.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-brand-950">Progress history</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Each dated entry reflects a saved Premium report on your account — open the full write-up anytime from My reports.
        </p>
        {timelineRows.length === 0 ? (
          <p className="mt-5 text-sm text-brand-700">Your timeline appears after your first saved Premium report.</p>
        ) : (
          <ul className="mt-5 divide-y divide-brand-100 rounded-xl border border-brand-100">
            {timelineRows.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-brand-900">{formatIsoDateUk(row.created_at)}</span>
                <span className="text-sm tabular-nums text-brand-800">
                  {row.readiness_score} · {row.readiness_label}
                </span>
                <Link
                  href={`/reports/${row.id}`}
                  className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline sm:text-right"
                >
                  Open report
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {summaries.length > 0 ? (
        <p className="mt-10 text-center text-sm text-brand-600">
          Need the full list?{" "}
          <Link href="/my-reports" className="font-semibold text-teal-900 underline-offset-4 hover:underline">
            Go to My reports
          </Link>
        </p>
      ) : null}
    </Section>
  );
}
