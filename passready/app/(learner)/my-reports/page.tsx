import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/Button";
import { LIFETIME_MEMBER_UI, PRICING } from "@/lib/constants";
import { formatIsoDateUk } from "@/lib/formatting";
import { getEntitlementLookupForUser } from "@/lib/server/repositories/entitlements-repository";
import { listMockTestDeliveriesForLearner } from "@/lib/server/repositories/learner-mock-test-repository";
import { getReportSummaryByUserId } from "@/lib/server/repositories/reports-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reports",
  description: "Open your saved Prep2Pass Test Ready Score reports and start a new assessment.",
};

function outcomeFromLabel(label: string): string {
  if (label === "Test Ready") return "Strong";
  if (label === "Nearly Test Ready") return "Close";
  if (label === "Needs More Time") return "Build time";
  return "Steady focus";
}

export default async function MyReportsPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login?next=%2Fmy-reports");
  }
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent("/auth/resume?continue=/my-reports")}`);
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

  const titleName = firstName ? `${firstName}, your reports` : "Your report library";

  const [summaries, entitlements, mockTests] = await Promise.all([
    getReportSummaryByUserId(user.id),
    getEntitlementLookupForUser(user.id),
    isSupabaseConfigured() ? listMockTestDeliveriesForLearner(user.id) : Promise.resolve([]),
  ]);

  const lifetimeFlag = entitlements.hasLifetimeAccess;
  const hasSingleOnly = entitlements.hasPurchasedSingleReport && !entitlements.hasLifetimeAccess;
  const count = summaries.length;

  return (
    <div className="flex flex-col gap-8 pb-6">
      <header className="relative overflow-hidden rounded-3xl border border-teal-200/55 bg-gradient-to-br from-brand-950 via-[#134e4a] to-slate-900 px-6 py-8 text-white shadow-[0_28px_80px_-36px_rgba(15,40,54,0.55)] ring-1 ring-white/10 sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-200/90">Premium library</p>
          <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-[1.65rem]">{titleName}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200/95">
            {lifetimeFlag ? (
              <>
                <span className="font-semibold text-white">{LIFETIME_MEMBER_UI.badge}</span>. Every checkpoint you save
                appears below with dates and readiness scores.
              </>
            ) : (
              <>
                Saved Test Ready Score write-ups for this account. Open any card for the full coach note and action plan.
              </>
            )}
          </p>
          {count > 0 ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-semibold backdrop-blur-sm ring-1 ring-white/25">
              <span className="tabular-nums text-teal-100">{count}</span>
              <span className="text-slate-200">saved Premium report{count === 1 ? "" : "s"}</span>
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
        <Button href="/assessment" variant="conversion" className="min-h-[52px] flex-1 text-base shadow-[0_12px_40px_-14px_rgba(13,148,136,0.55)] sm:min-w-[200px]">
          New assessment
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border border-brand-200/90 bg-white px-5 text-sm font-semibold text-brand-950 shadow-md ring-1 ring-black/[0.04] transition hover:border-teal-300 hover:shadow-lg sm:flex-initial sm:min-w-[140px]"
        >
          Overview
        </Link>
        {lifetimeFlag ? (
          <Link
            href="/progress"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border border-teal-200/70 bg-teal-50/90 px-5 text-sm font-semibold text-teal-950 shadow-md ring-1 ring-teal-200/45 transition hover:bg-teal-100 sm:flex-initial sm:min-w-[140px]"
          >
            Full progress arc
          </Link>
        ) : null}
        {hasSingleOnly ? (
          <Link
            href="/upgrade"
            className="inline-flex min-h-[52px] flex-[1_1_100%] items-center justify-center rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-teal-50 px-5 text-sm font-semibold text-amber-950 shadow-md ring-1 ring-amber-200/50 transition hover:from-amber-100 hover:to-teal-100 sm:flex-initial sm:min-w-[220px]"
          >
            Upgrade · {PRICING.lifetime.display}
          </Link>
        ) : null}
      </div>

      {mockTests.length > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-brand-950">Instructor mock tests</h2>
            <Link href="/mock-tests" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-brand-100">
            {mockTests.slice(0, 3).map((item) => (
              <li key={item.deliveryId} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-950">
                    {item.instructorName} · {formatIsoDateUk(item.sentAt)}
                  </p>
                  <p className="text-xs capitalize text-brand-600">
                    {item.outcome} · {item.minorFaultCount} minor fault{item.minorFaultCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Link
                  href={`/mock-tests/${item.mockTestId}`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-brand-50"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="reports-list-heading">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-brand-200/80 pb-3">
          <h2 id="reports-list-heading" className="font-heading text-lg font-semibold tracking-tight text-brand-950">
            All Premium reports
          </h2>
          {summaries.length > 0 ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">{count} total</span>
          ) : null}
        </div>

        {summaries.length === 0 ? (
          <div className="mt-8 overflow-hidden rounded-3xl border border-dashed border-brand-200 bg-gradient-to-b from-brand-50/50 to-white px-6 py-16 text-center shadow-inner">
            <p className="mx-auto max-w-sm text-[15px] font-semibold text-brand-900">No saved reports yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-600">
              Complete an assessment and checkout when prompted. Your Premium write-up lands here automatically, ready for
              your next lesson conversation.
            </p>
            <Button href="/assessment" variant="conversion" className="mx-auto mt-8 min-h-[50px] min-w-[12rem]">
              Start assessment
            </Button>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {summaries.map((report, index) => (
              <li key={report.id}>
                <Link
                  href={`/reports/${report.id}`}
                  className="group relative flex gap-4 overflow-hidden rounded-2xl border border-brand-100 bg-white p-5 shadow-[0_14px_40px_-26px_rgba(28,34,48,0.45)] ring-1 ring-black/[0.035] transition active:scale-[0.995] hover:border-teal-200/90 hover:shadow-[0_22px_50px_-28px_rgba(13,148,136,0.35)] sm:gap-5 sm:p-6"
                >
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-50/0 via-transparent to-teal-50/55 opacity-0 transition group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="relative flex shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 px-4 py-3 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22)] ring-2 ring-teal-500/30 sm:min-w-[5.25rem] sm:py-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-100/90">
                      Score
                    </span>
                    <span className="font-heading text-3xl font-bold tabular-nums text-white sm:text-[2rem]">
                      {report.readiness_score}
                    </span>
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-800 ring-1 ring-brand-100">
                        #{count - index}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-900 ring-1 ring-brand-200/80 ring-inset">
                        {outcomeFromLabel(report.readiness_label)}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold text-brand-950">{report.readiness_label}</p>
                    <p className="mt-1 text-xs font-medium text-brand-500">{formatIsoDateUk(report.created_at)}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-teal-800 transition group-hover:gap-2">
                      View Premium report
                      <span aria-hidden className="text-teal-600">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs leading-relaxed text-brand-600">
        {lifetimeFlag ? (
          <Link href="/progress" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
            Deeper timelines and milestones on Progress
          </Link>
        ) : (
          "Unlock lifetime to chart every Premium save on the Progress screen."
        )}
      </p>
    </div>
  );
}
