import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Section } from "@/components/Section";
import { LIFETIME_MEMBER_UI } from "@/lib/constants";
import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lifetime access",
  description: "Your Prep2Pass lifetime membership summary and shortcuts.",
};

export default async function LifetimeMembershipPage() {
  const user = await getServerAuthUser();
  if (!user?.emailConfirmedAt) {
    redirect(`/login?next=${encodeURIComponent("/lifetime")}`);
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

  const ok = await getLifetimeAccessByUserId(user.id);
  if (!ok) {
    redirect("/upgrade");
  }

  const greeting = firstName ? `${firstName}, you are covered` : "You are covered";

  return (
    <Section className="bg-brand-50" contentClassName="max-w-3xl">
      <div className="rounded-[1.65rem] border border-brand-200/80 bg-white p-8 shadow-card ring-1 ring-black/[0.03] sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-800/85">Membership</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">{greeting}</h1>

        <div className="mt-8 space-y-4 border-t border-brand-100 pt-8">
          <div className="rounded-2xl border border-teal-200/75 bg-teal-50/50 px-5 py-4">
            <p className="text-sm font-semibold text-teal-950">{LIFETIME_MEMBER_UI.badge}</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-800">{LIFETIME_MEMBER_UI.unlimited}</p>
          </div>
          <div className="rounded-2xl border border-brand-100/90 bg-brand-50/40 px-5 py-4">
            <p className="text-sm font-semibold text-brand-950">{LIFETIME_MEMBER_UI.journey}</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">{LIFETIME_MEMBER_UI.progressRhythm}</p>
          </div>
        </div>

        <nav className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap" aria-label="Member shortcuts">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Open dashboard
          </Link>
          <Link
            href="/dashboard#driving-journey"
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
          >
            Go to milestones
          </Link>
          <Link
            href="/my-reports"
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
          >
            {LIFETIME_MEMBER_UI.reportsHistory}
          </Link>
          <Link
            href="/assessment"
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
          >
            New assessment
          </Link>
        </nav>

        <p className="mt-10 text-center text-xs leading-relaxed text-brand-500">
          Questions stay with Prep2Pass support channels; nothing here is a subscription or renewal reminder.
        </p>
      </div>
    </Section>
  );
}
