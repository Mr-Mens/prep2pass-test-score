import type { Metadata } from "next";
import Link from "next/link";

import { LearnerSignOutButton } from "@/components/learner/LearnerSignOutButton";
import { SITE } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
  description: `Your ${SITE.name} parent workspace account and shortcuts.`,
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
  return "PA";
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

export default async function SupervisorAccountPage() {
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
  const greetingName = displayNameRaw || "Supervisor";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">Account</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Your parent workspace profile, shortcuts, and help.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-xl font-semibold text-white shadow-sm">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-lg font-semibold text-brand-950">{greetingName}</p>
            <p className="mt-1 break-all text-sm text-brand-600">{raw?.email ?? "Not set"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Workspace</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            You are signed in as a parent or supervisor. Link a learner to view their Test Ready Score Reports,
            progress, and practice notes.
          </p>
        </div>
      </section>

      <nav
        className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm"
        aria-label="Parent workspace shortcuts"
      >
        <MenuRow href="/supervisor" title="Home" hint="Parent dashboard overview" />
        <MenuRow href="/supervisor/link-learner" title="Link learner" hint="Connect your learner's account" />
        <MenuRow href="/supervisor/practice-log" title="Practice log" hint="Record private practice sessions" />
        <MenuRow href="/supervisor/reports" title="Reports" hint="View linked learner reports" />
        <MenuRow href="/supervisor/progress" title="Progress" hint="Track syllabus and score trends" />
        <MenuRow href="/terms" title="Terms & privacy" hint="Prep2Pass legal and policies" />
        <MenuRow href="mailto:hello@prep2pass.co.uk" title="Help & support" hint="hello@prep2pass.co.uk" />
      </nav>

      <LearnerSignOutButton />

      <p className="text-center text-xs leading-relaxed text-brand-600">
        You are securely signed into the parent workspace.
      </p>
    </div>
  );
}
