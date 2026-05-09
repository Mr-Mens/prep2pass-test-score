"use client";

import Link from "next/link";

import { Button } from "@/components/Button";
import { LIFETIME_MEMBER_UI, PRICING } from "@/lib/constants";
import { formatIsoDateUk } from "@/lib/formatting";
import type { ProgressEntry } from "@/lib/validation";

const card =
  "rounded-2xl border border-brand-200/80 bg-white p-5 shadow-card ring-1 ring-black/[0.02] sm:p-6 print:hidden";

type Props =
  | { status: "loading" }
  | {
      status: "ready";
      hasLifetimeAccess: boolean;
      entries: ProgressEntry[];
      currentScore: number;
    };

export function ProgressTrackingSection(props: Props) {
  if (props.status === "loading") {
    return (
      <div className={`${card} animate-pulse`} aria-busy="true">
        <div className="h-5 w-40 rounded bg-brand-100" />
        <div className="mt-4 h-24 w-full rounded-xl bg-brand-50" />
      </div>
    );
  }

  const { hasLifetimeAccess, entries, currentScore } = props;

  if (hasLifetimeAccess) {
    const improvement =
      entries.length >= 2 ? entries[entries.length - 1]!.score - entries[entries.length - 2]!.score : null;

    const rowBase =
      "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm";
    const rowInteractive =
      "cursor-pointer transition hover:border-teal-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300";

    return (
      <div className={card}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-500">{LIFETIME_MEMBER_UI.journey}</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-brand-950 sm:text-xl">Progress updates</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-600">{LIFETIME_MEMBER_UI.progressRhythm}</p>

        {entries.length === 0 ? (
          <p className="mt-4 text-sm text-brand-700">
            Your timeline grows as reports save to Prep2Pass. Finish your next assessment and it will slot in here beside
            this score.
          </p>
        ) : (
          <>
            <ul className="mt-5 space-y-3">
              {entries.map((e) => {
                const date = formatIsoDateUk(e.recordedAt);
                const dateLabel = <span className="text-brand-600">{date}</span>;
                const scoreLabel = (
                  <span className="font-semibold tabular-nums text-brand-950">
                    {e.score} <span className="font-medium text-brand-600">· {e.label}</span>
                  </span>
                );

                return (
                  <li key={e.reportId}>
                    <Link
                      href={`/reports/${e.reportId}`}
                      className={`group ${rowBase} ${rowInteractive}`}
                      aria-label={`Open report from ${date}, score ${e.score} out of 100`}
                    >
                      {dateLabel}
                      <span className="flex items-center gap-2">
                        {scoreLabel}
                        <span aria-hidden className="text-brand-400 transition group-hover:translate-x-0.5">
                          ›
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm leading-relaxed text-teal-950">
              <p className="font-semibold text-teal-950">Previous vs current</p>
              <p className="mt-1">
                This report: <span className="font-semibold tabular-nums">{currentScore}</span> out of 100.
              </p>
              {improvement !== null ? (
                <p className="mt-2 font-medium">
                  {improvement > 0 ? (
                    <>Improvement: +{improvement} points since your previous saved report.</>
                  ) : improvement < 0 ? (
                    <>Change since last report: {improvement} points. Worth reviewing what shifted with your instructor.</>
                  ) : (
                    <>Same score as your previous saved report. Consistency matters before you move dates.</>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-teal-900/90">
                  Take another assessment after a few lessons to unlock a before/after comparison.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-200/90 bg-gradient-to-br from-brand-50/90 to-white p-5 shadow-card ring-1 ring-teal-900/[0.04] sm:p-6 print:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(20,184,166,0.06))]" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-500">Progress tracking</p>
      <p className="relative mt-2 text-base font-semibold tracking-tight text-brand-950">
        Track progress over time with lifetime access
      </p>
      <p className="relative mt-2 max-w-prose text-sm leading-relaxed text-brand-700">
        Lifetime unlock keeps a private timeline of your Test Ready scores so you can see improvement between lessons.
      </p>
      <Button
        href="/upgrade"
        variant="conversion"
        className="relative mt-5 w-full min-h-[52px] sm:w-auto sm:min-w-[14rem]"
      >
        Upgrade to lifetime ({PRICING.lifetime.display})
      </Button>
    </div>
  );
}
