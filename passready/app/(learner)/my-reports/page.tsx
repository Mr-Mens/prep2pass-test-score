import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/Button";
import { LIFETIME_MEMBER_UI, PRICING } from "@/lib/constants";
import { formatIsoDateUk } from "@/lib/formatting";
import { getEntitlementLookupForUser } from "@/lib/server/repositories/entitlements-repository";
import { getReportSummaryByUserId } from "@/lib/server/repositories/reports-repository";
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

  const greeting = firstName || "Your saved reports";

  const [summaries, entitlements] = await Promise.all([
    getReportSummaryByUserId(user.id),
    getEntitlementLookupForUser(user.id),
  ]);

  const latest = summaries[0];
  const hasSingleOnly = entitlements.hasPurchasedSingleReport && !entitlements.hasLifetimeAccess;
  const lifetimeFlag = entitlements.hasLifetimeAccess;

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">{greeting}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          {lifetimeFlag
            ? `${LIFETIME_MEMBER_UI.badge}. Every Premium save stays here on this device-friendly view.`
            : "Premium reports tied to your account. Tap a card for the full write-up."}
        </p>
      </div>

      <Button href="/assessment" variant="conversion" className="min-h-[52px] w-full text-base shadow-md">
        Start a new assessment
      </Button>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-brand-100 bg-white px-4 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          Home overview
        </Link>
        {lifetimeFlag ? (
          <Link
            href="/progress"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-brand-100 bg-white px-4 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            Score arc
          </Link>
        ) : null}
        {hasSingleOnly ? (
          <Link
            href="/upgrade"
            className="inline-flex min-h-[44px] flex-[1_1_100%] items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-900 shadow-sm hover:bg-teal-100"
          >
            Upgrade to lifetime · {PRICING.lifetime.display}
          </Link>
        ) : null}
      </div>

      {latest ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Snapshot</p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <p className="font-heading text-4xl font-semibold tabular-nums text-brand-950">{latest.readiness_score}</p>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900 ring-1 ring-brand-200">
              {latest.readiness_label}
            </span>
          </div>
          <p className="mt-4 text-xs text-brand-500">{formatIsoDateUk(latest.created_at)}</p>
          <Link
            href={`/reports/${latest.id}`}
            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-sm font-semibold text-teal-900 shadow-sm hover:bg-teal-100"
          >
            Quick open latest report
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="reports-list-heading">
        <h2 id="reports-list-heading" className="text-lg font-semibold text-brand-950">
          All Premium reports
        </h2>
        {summaries.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white/80 px-6 py-12 text-center text-sm leading-relaxed text-brand-700">
            No saved reports yet. Finish an assessment, complete checkout when prompted, then your Premium write-up arrives
            here automatically.
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-4">
            {summaries.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/reports/${report.id}`}
                  className="block rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition active:scale-[0.99] hover:border-teal-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-heading text-3xl font-semibold tabular-nums leading-none text-brand-950">{report.readiness_score}</p>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-brand-500">{formatIsoDateUk(report.created_at)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900 ring-1 ring-brand-100">
                      {outcomeFromLabel(report.readiness_label)}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-brand-800">{report.readiness_label}</p>
                  <span className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-teal-600 py-3 text-sm font-semibold text-white">
                    View report
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs leading-relaxed text-brand-600">
        {lifetimeFlag ? (
          <Link href="/progress" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
            See how checkpoints connect on Progress
          </Link>
        ) : (
          "Unlock lifetime to chart every Premium save on the Progress screen."
        )}
      </p>
    </div>
  );
}
