import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LIFETIME_MEMBER_UI, BRAND_CTA } from "@/lib/constants";
import { getEffectiveLifetimeAccessByUserId } from "@/lib/server/effective-lifetime-access";
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

  const ok = await getEffectiveLifetimeAccessByUserId(user.id);
  if (!ok) {
    redirect("/upgrade");
  }

  const greeting = firstName ? `${firstName}, you are covered` : "You are covered";

  return (
    <div className="flex flex-col pb-4">
      <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Membership</p>
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
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Open dashboard
          </Link>
          <Link
            href="/progress"
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-brand-100 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            Go to milestones
          </Link>
          <Link
            href="/my-reports"
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-brand-100 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            {LIFETIME_MEMBER_UI.reportsHistory}
          </Link>
          <Link
            href="/assessment"
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-brand-100 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            {BRAND_CTA.getAnotherScore}
          </Link>
        </nav>

        <p className="mt-10 text-center text-xs leading-relaxed text-brand-500">
          Questions stay with Prep2Pass support channels; nothing here is a subscription or renewal reminder.
        </p>
      </div>
    </div>
  );
}
