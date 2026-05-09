import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { LIFETIME_MEMBER_UI, PRICING } from "@/lib/constants";
import { formatIsoDateUk } from "@/lib/formatting";
import { getEntitlementLookupForUser } from "@/lib/server/repositories/entitlements-repository";
import { getReportSummaryByUserId } from "@/lib/server/repositories/reports-repository";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My reports",
  description:
    "Open your saved Prep2Pass Test Ready Score reports, see your latest score, and start a new assessment.",
};

export default async function MyReportsPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login?next=%2Fmy-reports");
  }
  if (!user.emailConfirmedAt) {
    redirect(
      `/verify-email?next=${encodeURIComponent("/auth/resume?continue=/my-reports")}`,
    );
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

  const [summaries, entitlements] = await Promise.all([
    getReportSummaryByUserId(user.id),
    getEntitlementLookupForUser(user.id),
  ]);

  const latest = summaries[0];
  const hasSingleOnly = entitlements.hasPurchasedSingleReport && !entitlements.hasLifetimeAccess;
  const lifetimeFlag = entitlements.hasLifetimeAccess;

  return (
    <Section className="bg-brand-50" contentClassName="max-w-3xl">
      <div className="mb-8 rounded-2xl border border-brand-200/70 bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">My reports</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          {greeting}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-600">
          {lifetimeFlag ? (
            <>
              {LIFETIME_MEMBER_UI.badge} · Your reports stay private on Prep2Pass, tied to this account—not a recurring pitch in
              your inbox.
            </>
          ) : (
            <>
              Your reports are saved securely to your Prep2Pass account so only you can open them. Stripe handles payments directly;
              Prep2Pass never sells your inbox to advertisers.
            </>
          )}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/assessment" variant="conversion" className="w-full sm:w-auto sm:min-w-[12rem]">
            Start a new assessment
          </Button>
          {hasSingleOnly ? (
            <Button href="/upgrade" variant="secondary" className="w-full sm:w-auto">
              Upgrade to lifetime ({PRICING.lifetime.display})
            </Button>
          ) : null}
          {lifetimeFlag ? (
            <Button href="/dashboard" variant="secondary" className="w-full sm:w-auto sm:min-w-[12rem]">
              Progress dashboard
            </Button>
          ) : null}
        </div>

        <dl className="mt-8 grid gap-4 border-t border-brand-100 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">Access</dt>
            <dd className="mt-1 text-sm font-medium text-brand-900">
              {entitlements.hasLifetimeAccess ? (
                <>
                  {LIFETIME_MEMBER_UI.unlimited}{" "}
                  <span className="font-normal text-brand-600">· {LIFETIME_MEMBER_UI.badge}</span>
                </>
              ) : (
                "One-off reports on this account"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">Saved reports</dt>
            <dd className="mt-1 text-sm font-medium text-brand-900">{entitlements.reportCount}</dd>
          </div>
          {latest ? (
            <>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">Latest score</dt>
                <dd className="mt-1 text-sm font-medium text-brand-900 tabular-nums">
                  {latest.readiness_score}/100 · {latest.readiness_label}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">Last updated</dt>
                <dd className="mt-1 text-sm font-medium text-brand-900">{formatIsoDateUk(latest.created_at)}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </div>

      {entitlements.hasLifetimeAccess ? (
        <div className="mb-10 rounded-2xl border border-teal-200/75 bg-teal-50/40 p-6 shadow-sm sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">{LIFETIME_MEMBER_UI.journeyInsights}</p>
          <h2 className="mt-3 text-base font-semibold tracking-tight text-teal-950">{LIFETIME_MEMBER_UI.journey}</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            Your readiness arc lives on the dashboard—dated checkpoints plus language that tracks how themes evolve before test
            day.
          </p>
          <Link
            href="/dashboard#driving-journey"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-900 underline-offset-4 hover:underline"
          >
            Continue your journey timeline
          </Link>
        </div>
      ) : null}

      <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-brand-950">Your reports</h2>
        {summaries.length === 0 ? (
          <p className="mt-4 text-sm text-brand-700">
            {lifetimeFlag
              ? "Your next saved Premium report lands here automatically after scoring. Whenever you finish an assessment while signed in, the library updates on its own."
              : "Finish an assessment and checkout. Afterwards your Premium report lands here automatically."}
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-brand-100">
            {summaries.map((report) => (
              <li key={report.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-950">{formatIsoDateUk(report.created_at)}</p>
                  <p className="text-xs text-brand-600">
                    Score {report.readiness_score} · {report.readiness_label}
                  </p>
                </div>
                <Link
                  href={`/reports/${report.id}`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50 sm:min-h-0"
                >
                  Open report
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
