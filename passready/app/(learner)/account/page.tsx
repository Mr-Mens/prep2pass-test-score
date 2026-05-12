import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LearnerSignOutButton } from "@/components/learner/LearnerSignOutButton";
import { LIFETIME_MEMBER_UI, PRICING, SITE } from "@/lib/constants";
import { getEntitlementLookupForUser } from "@/lib/server/repositories/entitlements-repository";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
  description: `Your ${SITE.name} learner account settings and saved reports.`,
};

function accountInitials(displayName: string, email: string | undefined): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const mail = email?.split("@")[0]?.replace(/[^a-zA-Z]/g, "") ?? "";
  if (mail.length >= 2) return mail.slice(0, 2).toUpperCase();
  if (mail.length === 1) return `${mail}X`.toUpperCase();
  return "YOU";
}

type MenuRowProps = { href: string; title: string; hint?: string };

function MenuRow({ href, title, hint }: MenuRowProps) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-brand-50/90 active:bg-brand-50"
    >
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-brand-950">{title}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-brand-500">{hint}</span> : null}
      </span>
      <span className="shrink-0 text-lg font-light text-brand-400" aria-hidden>
        ›
      </span>
    </Link>
  );
}

export default async function LearnerAccountPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/login?next=%2Faccount");
  if (!user.emailConfirmedAt) redirect(`/verify-email?next=${encodeURIComponent("/account")}`);

  const entitlements = await getEntitlementLookupForUser(user.id);

  const sb = createSupabaseServerClient();
  const {
    data: { user: raw },
  } = await sb.auth.getUser();

  const meta = raw?.user_metadata as Record<string, unknown> | undefined;
  const displayNameRaw =
    (typeof meta?.first_name === "string" && meta.first_name.trim()) ||
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.firstName === "string" && meta.firstName.trim()) ||
    "";

  const initials = accountInitials(displayNameRaw, raw?.email);
  const greetingName = displayNameRaw || "Learner";

  const planLabel =
    entitlements.hasLifetimeAccess
      ? `${LIFETIME_MEMBER_UI.badge}`
      : entitlements.hasPurchasedSingleReport
        ? `One-off Premium report (${PRICING.single.display ?? "purchase"})`
        : `No Premium save yet`;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">Account</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Membership, shortcuts, and help — organised like a compact app profile.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-xl font-semibold text-white shadow-sm">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-lg font-semibold text-brand-950">{greetingName}</p>
            <p className="mt-1 break-all text-sm text-brand-600">{raw?.email ?? "—"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Plan</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="flex-1 text-sm font-semibold leading-snug text-brand-950">{planLabel}</p>
            {entitlements.hasLifetimeAccess ? (
              <span className="shrink-0 rounded-full bg-teal-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Lifetime
              </span>
            ) : (
              <Link
                href="/upgrade"
                className="inline-flex min-h-[40px] shrink-0 items-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Upgrade
              </Link>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-6 border-t border-brand-200/70 pt-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Saved reports</p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-brand-950">{entitlements.reportCount}</p>
            </div>
            <div className="min-w-[12rem] flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Access</p>
              <p className="mt-1 text-sm leading-relaxed text-brand-700">
                {entitlements.hasLifetimeAccess
                  ? LIFETIME_MEMBER_UI.unlimited
                  : "Lifetime unlocks unlimited checkpoints and tighter progress arcs."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <nav
        className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm"
        aria-label="Shortcuts"
      >
        <MenuRow href="/home" title="Home" hint="FAQs, sample report, pricing" />
        <MenuRow href="/dashboard" title="Overview" hint="Readiness hub and checkpoints" />
        <MenuRow href="/assessment" title="Check test readiness" hint="Short assessment flow" />
        {entitlements.hasLifetimeAccess ? (
          <MenuRow href="/progress" title="Progress timeline" hint="Score arc across Premium reports" />
        ) : null}
        <MenuRow href="/my-reports" title="Saved reports" hint="Open past write-ups" />
        {!entitlements.hasLifetimeAccess ? (
          <MenuRow href="/upgrade" title="Upgrade to lifetime" hint={`One-time · ${PRICING.lifetime.display}`} />
        ) : null}
        <MenuRow href="/terms" title="Terms & privacy" hint="Prep2Pass legal and policies" />
        <MenuRow href="mailto:hello@prep2pass.co.uk" title="Help & support" hint="hello@prep2pass.co.uk" />
      </nav>

      <LearnerSignOutButton />

      <p className="text-center text-xs leading-relaxed text-brand-600">
        You are securely signed into the learner app workspace.
      </p>
    </div>
  );
}
