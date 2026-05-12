import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/Button";
import { SITE } from "@/lib/constants";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Supervisor · Test Ready Score",
  description: `${SITE.name}: support your learner between lessons with reports and guidance.`,
};

export default async function SupervisorPlaceholderPage() {
  const user = await getServerAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/supervisor")}`);
  if (!user.emailConfirmedAt) redirect(`/verify-email?continue=${encodeURIComponent("/supervisor")}`);

  const role = await getUserAppRole(user.id);
  if (role === "instructor") redirect("/instructor");

  return (
    <div className="flex flex-col gap-8 pb-10">
      <header className="rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-teal-50/40 p-6 shadow-[0_22px_56px_-28px_rgba(76,29,149,0.35)] ring-1 ring-white sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-800">Parent &amp; supervisor workspace</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950">Support your learner&apos;s journey</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-brand-700">
          This dedicated supervisor area is on the way. Until then, everything you need lives in the same Prep2Pass learner tools:
          saved reports, readiness scores, and assessments — share access with your learner as you prefer.
        </p>
      </header>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
        <h2 className="font-heading text-lg font-semibold text-brand-950">What you can do today</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-brand-700">
          <li className="flex gap-2">
            <span className="text-teal-600" aria-hidden>
              •
            </span>
            <span>Open saved reports and scores from your learner&apos;s Prep2Pass account.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-600" aria-hidden>
              •
            </span>
            <span>Use the main overview to see checkpoints and next steps clearly.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-600" aria-hidden>
              •
            </span>
            <span>We&apos;ll place tailored supervisor views here in a future update.</span>
          </li>
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/dashboard" variant="conversion" className="min-h-[50px] flex-1">
            Open overview
          </Button>
          <Link
            href="/my-reports"
            className="inline-flex min-h-[50px] flex-1 items-center justify-center rounded-2xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
          >
            Saved reports
          </Link>
          <Link
            href="/explore"
            className="inline-flex min-h-[50px] flex-1 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50/60 px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
          >
            Explore site
          </Link>
        </div>
      </section>
    </div>
  );
}
