import type { ReactNode } from "react";
import Link from "next/link";

import { LIFETIME_MEMBER_UI } from "@/lib/constants";

function IconClipboard() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function IconStack() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function IconPhotos() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-13.35L18 9.75m-10.5 0V18h10.5V9.75m-10.5 0L6 6m3 .75 2.506-3.036a2.25 2.25 0 013.988 1.036M9 14.75h.008v.008H9v-.008z"
      />
    </svg>
  );
}

type ActionTileProps = {
  href: string;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  icon: ReactNode;
  tint: string;
};

function ActionTile({ href, kicker, title, body, cta, icon, tint }: ActionTileProps) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100/90 bg-white p-7 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg"
    >
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${tint}`}
        aria-hidden
      />
      <div className="flex items-start gap-5">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br p-3 text-white shadow-md ring-1 ring-black/10 ${tint}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal-700">{kicker}</p>
          <p className="mt-2 font-heading text-xl font-semibold tracking-tight text-brand-950 sm:text-[1.35rem]">{title}</p>
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-brand-600">{body}</p>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 transition-colors group-hover:text-teal-900">
        {cta}
        <span aria-hidden className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}

export default function InstructorDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-brand-200/60 bg-gradient-to-br from-white via-brand-50/80 to-teal-50/50 shadow-card ring-1 ring-brand-100/70">
        <div
          className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-teal-400/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-brand-400/10 blur-2xl"
          aria-hidden
        />
        <div className="relative px-8 py-10 sm:px-10 sm:py-11">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800/90">Instructor workspace</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl md:text-[2.375rem]">
            Instructor dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-700 sm:text-[1.0625rem]">
            Run DVSA-style mock tests, track pupils, and review outcomes — woven into{" "}
            <span className="font-semibold text-brand-900">Test Ready Score</span> so your cockpit prep stays in one calm
            place.
          </p>
          <p className="mt-6 max-w-2xl border-l-4 border-teal-500/60 pl-4 text-xs leading-relaxed text-brand-600 sm:text-sm">
            This toolkit is independent and not affiliated with DVSA. Built for Approved Driving Instructors to support
            professional teaching only.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/instructor/mock-test/new"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-6 text-sm font-semibold text-white shadow-md transition hover:from-teal-700 hover:to-teal-800 hover:shadow-lg"
            >
              Start mock test
            </Link>
            <Link
              href="/home"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-brand-200 bg-white px-6 text-sm font-semibold text-brand-800 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/90"
            >
              Learner premium home
            </Link>
          </div>
          <aside className="mt-10 rounded-2xl border border-teal-200/90 bg-teal-50/90 p-5 shadow-inner sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-teal-900">{LIFETIME_MEMBER_UI.badge}</p>
                <p className="mt-2 text-sm font-semibold text-brand-950">
                  Instructor accounts include full learner Premium access at no charge.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-brand-700">
                  Assessments, unlimited saved reports, and Progress — whenever you dip into the learner app.
                </p>
              </div>
              <Link
                href="/home"
                className="inline-flex shrink-0 min-h-[44px] items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 sm:self-center"
              >
                Open learner home
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <ActionTile
          href="/instructor/mock-test/new"
          kicker="Mock test"
          title="Start new mock test"
          body="Structured form with live pass or fail verdict, configurable fault thresholds, and quick fault chips for the drive."
          cta="Open tool"
          icon={<IconClipboard />}
          tint="from-teal-600 to-emerald-800"
        />
        <ActionTile
          href="/instructor/pupils"
          kicker="Pupils"
          title="My pupils"
          body="Maintain your roster and link by email where it matches Prep2Pass — so pupil context stays tidy."
          cta="Manage roster"
          icon={<IconUsers />}
          tint="from-cyan-600 to-teal-800"
        />
        <ActionTile
          href="/instructor/mock-tests"
          kicker="History"
          title="Mock test reports"
          body="Drafts and completed sessions in one scrollable list — open any row to revisit faults and verdict."
          cta="View list"
          icon={<IconStack />}
          tint="from-slate-700 to-brand-950"
        />
        <ActionTile
          href="/instructor/diagrams"
          kicker="Diagrams"
          title="Teaching diagrams"
          body="Starter library for the cab — placeholders today, more structured diagrams on the roadmap."
          cta="Browse"
          icon={<IconPhotos />}
          tint="from-teal-700 to-cyan-900"
        />
      </div>
    </div>
  );
}
