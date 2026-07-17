"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { PRODUCT, SMART_UI } from "@/lib/constants";
import { PLATFORM_TERMS } from "@/lib/platform-copy";

type RoleKey = "learner" | "instructor" | "parent";

const ROLE_DEST: Record<RoleKey, string> = {
  learner: "/dashboard",
  instructor: "/instructor",
  parent: "/supervisor",
};

function parseRoleKey(raw: string | null): RoleKey | null {
  if (raw === "learner" || raw === "instructor" || raw === "parent") return raw;
  return null;
}

function safeNextPath(raw: string | null): string | null {
  if (raw?.startsWith("/") && !raw.startsWith("//")) return raw;
  return null;
}

const ROLE_TAGLINE: Record<RoleKey, string> = {
  learner: "Your journey to test readiness starts here.",
  instructor: `${PLATFORM_TERMS.coachingTools} to manage pupils, run mock tests and track progress.`,
  parent: "Support your learner between lessons with Progress Insights, reports and coaching guidance.",
};

const DEFAULT_TAGLINE =
  "Choose how you use Pass Pilot: learner, instructor, or supervisor on our driving education platform.";

const ROLES: readonly {
  key: RoleKey;
  title: string;
  description: string;
  features: readonly string[];
  cta: string;
  accent: string;
  cardRing: string;
  buttonClass: string;
}[] = [
  {
    key: "learner",
    title: "I’m a Learner",
    description: "Get your test readiness score and prepare with confidence.",
    features: [
      "Get your Test Ready Score",
      `View ${SMART_UI.reports}`,
      SMART_UI.insights,
      SMART_UI.personalisedDebriefs,
    ],
    cta: "Continue as Learner",
    accent: "from-emerald-600 to-teal-600",
    cardRing: "ring-emerald-200/80 hover:ring-emerald-300",
    buttonClass:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/25 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]",
  },
  {
    key: "instructor",
    title: "I’m an instructor",
    description: "Manage pupils and mock tests with Coaching Tools.",
    features: [
      "Mock test tool",
      "Pupil progress tracking",
      "Teaching Diagrams",
      "Structured lesson support",
    ],
    cta: "Continue as Instructor",
    accent: "from-slate-700 to-brand-900",
    cardRing: "ring-slate-200/90 hover:ring-slate-300",
    buttonClass:
      "bg-gradient-to-r from-slate-700 to-brand-900 text-white shadow-lg shadow-brand-950/30 hover:from-slate-600 hover:to-brand-800 active:scale-[0.98]",
  },
  {
    key: "parent",
    title: "I’m a Parent / Supervisor",
    description: "Support your learner and track their progress with supervisor tools.",
    features: [
      "Monitor learner progress",
      "View reports and Test Ready Score",
      "Supervisor coaching guidance",
      "Support between lessons",
    ],
    cta: "Continue as Supervisor",
    accent: "from-violet-600 to-indigo-700",
    cardRing: "ring-violet-200/80 hover:ring-violet-300",
    buttonClass:
      "bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-900/25 hover:from-violet-500 hover:to-indigo-600 active:scale-[0.98]",
  },
];

export function WelcomeLanding() {
  const searchParams = useSearchParams();
  const roleFromUrl = parseRoleKey(searchParams.get("role"));
  const nextFromUrl = safeNextPath(searchParams.get("next"));
  const [selected, setSelected] = useState<RoleKey | null>(roleFromUrl);

  useEffect(() => {
    if (roleFromUrl) setSelected(roleFromUrl);
  }, [roleFromUrl]);

  const dest = useMemo(() => {
    if (nextFromUrl) return nextFromUrl;
    if (selected) return ROLE_DEST[selected];
    return "/dashboard";
  }, [nextFromUrl, selected]);
  const loginHref = `/login?next=${encodeURIComponent(dest)}`;
  const signupHref = `/signup?next=${encodeURIComponent(dest)}`;

  return (
    <div className="app-chrome-top relative min-h-dvh overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-teal-50/30 pb-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_50%_-15%,rgba(45,212,191,0.16),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-[min(50vh,28rem)] w-[min(140%,48rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(28,43,56,0.06),transparent_68%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col px-4 sm:max-w-xl sm:px-6 lg:max-w-5xl">
        <header className="flex flex-col items-center pt-4 text-center sm:pt-6">
          <div className="flex w-full max-w-md justify-center rounded-3xl border border-white/90 bg-white/95 px-6 py-6 shadow-lg shadow-brand-950/8 ring-1 ring-brand-100/90 backdrop-blur-md sm:max-w-lg sm:px-8 sm:py-8">
            <Link
              href="/"
              className="rounded-xl outline-none ring-teal-600 ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2"
              aria-label={`${PRODUCT.name}, home`}
            >
              <BrandLogo variant="welcome" />
            </Link>
          </div>
          <p className="mt-8 max-w-md text-[0.9375rem] leading-relaxed text-brand-700 sm:text-base">
            {selected ? ROLE_TAGLINE[selected] : DEFAULT_TAGLINE}
          </p>
          <p className="mt-2 text-sm font-medium text-brand-600">
            {selected
              ? selected === "learner"
                ? "Sign in or create your learner account"
                : selected === "instructor"
                  ? "Sign in or create your instructor account"
                  : "Sign in or create your supervisor account"
              : "Choose your role to continue"}
          </p>
        </header>

        {!selected ? (
          <div className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-3 lg:gap-5">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelected(r.key)}
                className={`group flex min-h-[220px] flex-col rounded-3xl border border-white/90 bg-white p-6 text-left shadow-[0_20px_50px_-26px_rgba(15,40,54,0.35)] ring-2 ring-inset transition hover:-translate-y-0.5 hover:shadow-[0_26px_56px_-24px_rgba(13,148,136,0.38)] sm:min-h-0 sm:p-7 ${r.cardRing}`}
              >
                <span
                  className={`inline-flex h-1.5 w-12 rounded-full bg-gradient-to-r ${r.accent} opacity-90 shadow-sm`}
                  aria-hidden
                />
                <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight text-brand-950 sm:text-xl">{r.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-600">{r.description}</p>
                <ul className="mt-4 flex flex-col gap-2 text-sm text-brand-700">
                  {r.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <span
                  className={`mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl text-sm font-semibold transition ${r.buttonClass}`}
                >
                  {r.cta}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="motion-safe:animate-welcome-auth-step mt-10 sm:mt-11">
            <div className="rounded-3xl border border-brand-100/90 bg-white/95 p-6 shadow-xl shadow-brand-950/[0.07] ring-1 ring-teal-100/80 backdrop-blur-sm sm:p-8">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
              >
                ← Choose a different role
              </button>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={loginHref}
                  className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-brand-200 bg-white text-base font-semibold text-brand-950 shadow-md transition hover:border-teal-300 hover:bg-brand-50/80 active:scale-[0.99]"
                >
                  Sign in
                </Link>
                <Link
                  href={signupHref}
                  className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-base font-semibold text-white shadow-lg shadow-teal-900/25 transition hover:from-teal-500 hover:to-emerald-500 active:scale-[0.99]"
                >
                  Create account
                </Link>
                <Link
                  href="/forgot-password"
                  className="py-2 text-center text-sm font-semibold text-brand-700 underline-offset-4 hover:text-teal-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>
        )}

        <section className="mt-12 text-center lg:mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-400">Trusted &amp; minimal</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-brand-600">
            <Link href="/privacy" className="rounded-lg px-1 py-0.5 transition hover:bg-brand-50 hover:text-teal-900">
              Privacy Policy
            </Link>
            <span className="text-brand-300" aria-hidden>
              ·
            </span>
            <Link href="/terms" className="rounded-lg px-1 py-0.5 transition hover:bg-brand-50 hover:text-teal-900">
              Terms of Service
            </Link>
          </div>
          <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-brand-500">
            Secure &amp; private · Your data is protected · Trusted by learners &amp; instructors
          </p>
          <p className="mt-8 text-sm text-brand-600">
            Prefer the full overview with FAQs &amp; sample report?{" "}
            <Link href="/explore" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
              Explore the site →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
