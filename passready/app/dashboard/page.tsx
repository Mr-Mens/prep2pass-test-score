import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/Button";
import { DashboardTrajectory } from "@/components/dashboard/DashboardTrajectory";
import { LIFETIME_MEMBER_UI } from "@/lib/constants";
import {
  deriveDeltaVsPrior,
  deriveFocusArea,
  deriveJourneyTags,
  deriveMomentumVoice,
  deriveNextMilestone,
  deriveStrongestPhrase,
} from "@/lib/dashboard/journey-insights";
import { formatIsoDateUk } from "@/lib/formatting";
import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { listJourneySnapshotsByUserId } from "@/lib/server/repositories/reports-repository";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Progress dashboard",
  description:
    "A calm driving-journey dashboard for Prep2Pass lifetime learners: milestones, readiness arc, and your next focus.",
};

export default async function ProgressDashboardPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent("/dashboard")}`);
  }

  const lifetimeFlag = await getLifetimeAccessByUserId(user.id);
  if (!lifetimeFlag) {
    redirect("/my-reports");
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

  const greetingHeadline = firstName ? `${firstName}, map the road ahead` : "Map the lane ahead calmly";

  const snaps = await listJourneySnapshotsByUserId(user.id);
  const deltaVsPrior = deriveDeltaVsPrior(snaps);
  const voice = deriveMomentumVoice(snaps, deltaVsPrior);
  const journeyTags = deriveJourneyTags(snaps);
  const latest = snaps.length ? snaps[snaps.length - 1]! : null;
  const prev = snaps.length >= 2 ? snaps[snaps.length - 2]! : null;

  const scores = snaps.map((s) => s.readiness_score);
  const bestScore = scores.length ? Math.max(...scores) : null;
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const focusCopy =
    deriveFocusArea(latest) ??
    "On your next assessment, tick the manoeuvres still rehearsing quietly. Specificity keeps feedback human.";
  const strongestCopy = deriveStrongestPhrase(snaps, latest);
  const milestoneCopy = deriveNextMilestone(latest);

  const feedNewestFirst = [...snaps].reverse();

  const firstReportIso = snaps[0]?.created_at;

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-50 via-brand-50/85 to-teal-50/20 pb-[5.85rem] pt-12 sm:pb-24 sm:pt-14 lg:pb-24 lg:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(ellipse_75%_45%_at_28%_-10%,rgba(45,212,191,0.16),transparent)]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-7 px-3 sm:gap-10 sm:px-6 lg:px-8">
        {/* Command centre */}
        <div className="relative overflow-hidden rounded-[1.85rem] border border-teal-400/35 bg-gradient-to-br from-brand-950 via-[#171f2f] to-[#124943] px-5 py-7 shadow-[0_32px_68px_-20px_rgba(15,23,42,0.58)] sm:px-8 sm:py-10 lg:px-10 lg:py-11">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.42]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-10%] top-[-30%] h-[420px] w-[420px] rounded-full bg-teal-400/12 blur-[120px]"
          />

          {/* Mobile-first: dominant score */}
          <div className="relative flex flex-col gap-10 lg:flex-row-reverse lg:items-start lg:justify-between lg:gap-14">
            {latest ? (
              <div className="w-full lg:max-w-md">
                <div className="rounded-[1.25rem] border border-white/14 bg-black/33 p-5 shadow-inner shadow-black/10 backdrop-blur-md sm:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-100">Latest stint</p>
                  <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
                    <p className="font-heading text-5xl font-semibold tabular-nums tracking-tight text-white sm:text-6xl">
                      {latest.readiness_score}
                      <span className="align-top text-3xl font-semibold text-white/65"> /100 </span>
                    </p>
                    {prev ? (
                      <div className="pb-2 text-[13px] text-white/[0.92]">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/72">
                          Previous
                        </span>
                        <span className="font-medium tabular-nums text-teal-50">{prev.readiness_score}/100</span>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 font-medium leading-snug text-teal-50">{latest.readiness_label}</p>

                  <div className="mt-6 space-y-2 border-t border-white/14 pt-5">
                    <p className={`text-[15px] font-semibold tracking-tight ${toneForMomentum(voice.tone)}`}>
                      {voice.headline}
                      {deltaVsPrior !== null && deltaVsPrior !== 0 ? (
                        <span className="ml-2 text-[13px] font-medium text-white/78">
                          versus your previous saved report
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[14px] leading-relaxed text-slate-200">{voice.subline}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="min-w-0 flex-1 space-y-5 lg:space-y-6">
              <div className="space-y-2">
                <p className="inline-flex items-center rounded-full border border-white/28 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-50">
                  {LIFETIME_MEMBER_UI.badge}
                </p>
                <p className="text-[13px] font-medium leading-snug text-teal-100/95">{LIFETIME_MEMBER_UI.unlimited}</p>
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/70">{LIFETIME_MEMBER_UI.journey}</p>
              </div>

              <h1 className="font-heading text-balance text-[1.82rem] font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.45rem] lg:leading-[1.12]">
                {greetingHeadline}
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-200">
                Instructor notes layered over time beat a spreadsheet here. Peek full write-ups whenever you want
                verbatim feedback in{" "}
                <Link
                  href="/my-reports"
                  className="font-semibold text-teal-200 underline-offset-[3px] hover:text-white hover:underline"
                >
                  My reports
                </Link>
                .
              </p>

              {journeyTags.length ? (
                <ul className="flex flex-wrap gap-2" aria-label="Milestones honoured on your profile">
                  {journeyTags.map((t) => (
                    <li
                      key={t.key}
                      className="rounded-full border border-white/35 bg-white/14 px-[11px] py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-50"
                    >
                      {t.label}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="hidden flex-wrap gap-3 lg:flex">
                <Link
                  href="/assessment"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-teal-400 px-6 text-sm font-semibold text-brand-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-300"
                >
                  New assessment
                </Link>
                <Link
                  href="/my-reports"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-white/28 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/14"
                >
                  Saved reports · library
                </Link>
              </div>
            </div>
          </div>

          <div className="relative mt-8 rounded-[1.45rem] border border-white/12 bg-black/30 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight text-white">Readiness arc</h2>
                <p className="mt-1 text-[13px] leading-snug text-slate-300">
                  Each labelled bead is your checkpoint. The curve stays smoothed so your own readings stay readable.
                </p>
              </div>
              {snaps.length >= 3 ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200">{snaps.length} stints</p>
              ) : null}
            </div>

            <DashboardTrajectory snapshotsChrono={snaps} userIdForIds={user.id} />
          </div>
        </div>

        {/* Narrative cockpit */}
        <div className="grid gap-5 lg:grid-cols-3">
          <JourneyCoachCard eyebrow="Steadiest lane so far" body={strongestCopy} accent="warm" />
          <JourneyCoachCard eyebrow="Current coaching focus" body={focusCopy} accent="teal" />
          <JourneyCoachCard eyebrow="Next purposeful milestone" body={milestoneCopy} accent="ink" />
        </div>

        {/* Compact stats ribbon */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardRibbon
            label="First checkpoint saved"
            value={firstReportIso ? formatIsoDateUk(firstReportIso) : "Waiting"}
            hint="The day this journal began counting"
          />
          <DashboardRibbon
            label="Stories logged"
            value={`${snaps.length}`}
            hint="Each new report you save extends this arc"
          />
          <DashboardRibbon
            label="Personal best score"
            value={bestScore !== null ? `${bestScore}/100` : "None yet"}
            hint={bestScore !== null ? "A moment worth remembering calmly" : "Room for celebration soon"}
          />
          <DashboardRibbon
            label="Average across stint"
            value={avgScore !== null ? `${avgScore}` : "None yet"}
            hint={snaps.length >= 3 ? "Steadying when outliers vanish from noise" : "Extra visits make averages kinder"}
          />
        </div>

        {/* Feed */}
        <div
          id="driving-journey"
          className="rounded-[1.55rem] border border-brand-200/75 bg-white/92 p-6 shadow-[0_20px_45px_-22px_rgba(28,43,56,0.16)] backdrop-blur sm:p-9"
        >
          <header className="flex flex-col gap-4 border-b border-brand-100/90 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-500">{LIFETIME_MEMBER_UI.reportsHistory}</p>
              <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-[1.7rem]">
                Milestones replayed newest first
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-600">
                Progress updates and checkpoints, newest first. Open any report when you want the full write-up alongside
                this snapshot.
              </p>
            </div>
            <Button href="/my-reports" variant="secondary" className="w-full shrink-0 sm:w-auto">
              Open saved library
            </Button>
          </header>

          {feedNewestFirst.length === 0 ? (
            <p className="mt-10 text-center text-sm text-brand-600">
              Run a new assessment when you are ready. Your first saved checkpoint appears here and your arc begins.
            </p>
          ) : (
            <ol className="relative mt-8 space-y-0 pl-[6px] sm:pl-2">
              <span
                aria-hidden
                className="absolute bottom-8 left-[18px] top-4 w-px rounded-full bg-gradient-to-b from-teal-400/85 via-teal-200/50 to-transparent sm:left-[26px]"
              />
              {feedNewestFirst.map((row, i) => {
                const older = feedNewestFirst[i + 1];
                const lapDelta = older ? row.readiness_score - older.readiness_score : null;
                const tag = lapLabel(snaps.length, lapDelta, feedNewestFirst.length - i);
                return (
                  <li key={row.id} className="relative pb-10 pl-14 sm:pl-[4.85rem] last:pb-0">
                    <span className="absolute left-[-2px] top-2 flex min-h-[40px] min-w-[44px] items-center justify-center rounded-[1rem] border border-teal-200 bg-white pb-1 pt-1 shadow-[0_10px_30px_-12px_rgba(15,118,110,0.55)] ring-[5px] ring-teal-100/90 sm:left-1">
                      <span className="font-heading text-[15px] font-semibold tabular-nums leading-none text-teal-900">
                        {row.readiness_score}
                      </span>
                    </span>
                    <article className="flex flex-col gap-4 rounded-2xl border border-brand-100/85 bg-brand-50/35 p-[18px] sm:flex-row sm:items-center sm:justify-between lg:p-[22px]">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                            {formatIsoDateUk(row.created_at)}
                          </p>
                          {tag ? (
                            <span className="rounded-full border border-teal-200/80 bg-teal-50/90 px-[10px] py-0.5 text-[11px] font-semibold capitalize tracking-normal text-teal-900">
                              {tag}
                            </span>
                          ) : null}
                          {lapDelta !== null ? (
                            <span
                              className={`rounded-full px-2 py-[3px] text-[11px] font-bold uppercase tracking-normal ${
                                lapDelta > 0
                                  ? "bg-emerald-100 text-emerald-950"
                                  : lapDelta < 0
                                    ? "bg-amber-100 text-amber-950"
                                    : "bg-brand-100 text-brand-900"
                              }`}
                            >
                              {lapDelta > 0 ? `+${lapDelta}` : lapDelta === 0 ? "Flat hold" : `${lapDelta}`} vs prior stint
                            </span>
                          ) : (
                            <span className="rounded-full bg-brand-50 px-2 py-[3px] text-[11px] font-semibold text-brand-800">
                              Benchmark anchor
                            </span>
                          )}
                        </div>
                        <h3 className="text-[1.06rem] font-semibold tracking-tight text-brand-950">{row.readiness_label}</h3>
                      </div>
                      <Link
                        href={`/reports/${row.id}`}
                        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-[14px] font-semibold text-brand-900 shadow-sm transition hover:border-teal-300/85 hover:bg-teal-50/60"
                      >
                        Revisit narration
                      </Link>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <p className="text-center text-sm text-brand-600">
          Fancy the folder view?{" "}
          <Link href="/my-reports" className="font-semibold text-teal-900 underline-offset-4 hover:underline">
            Wander over to My reports
          </Link>
        </p>
      </div>

      {/* Thumb-friendly reassurance CTA */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-teal-200/35 bg-brand-950/96 px-4 py-3 shadow-[0_-8px_32px_-12px_rgba(8,41,43,0.55)] backdrop-blur-md lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-xl">
          <Link
            href="/assessment"
            className="flex min-h-[49px] w-full items-center justify-center rounded-2xl bg-teal-400 text-[15px] font-semibold text-brand-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-300 active:translate-y-[0.5px]"
          >
            New assessment
          </Link>
          <p className="mt-2 text-center text-[11px] leading-snug text-teal-100">Keeps journaling honest between lessons</p>
        </div>
      </div>
    </section>
  );
}

function toneForMomentum(t: "lift" | "hold" | "soften" | "open"): string {
  if (t === "lift") return "text-teal-200";
  if (t === "soften") return "text-amber-100";
  return "text-white";
}

function lapLabel(totalSnaps: number, lapDelta: number | null, reverseIndex: number): string | null {
  if (lapDelta !== null && lapDelta >= 10) return "Meaningful lift";
  if (reverseIndex === totalSnaps && totalSnaps > 1) return "Latest reflection";
  if (reverseIndex === 1 && totalSnaps >= 5) return "Earliest stint";
  return null;
}

function JourneyCoachCard({
  eyebrow,
  body,
  accent,
}: {
  eyebrow: string;
  body: string;
  accent: "warm" | "teal" | "ink";
}) {
  const ring =
    accent === "warm"
      ? "from-amber-100/95 via-white to-white border-amber-200/85"
      : accent === "teal"
        ? "from-teal-50 via-white to-white border-teal-200/85"
        : "from-brand-50 via-white to-white border-brand-200/85";
  const eyebrowColour =
    accent === "warm" ? "text-amber-950/72" : accent === "teal" ? "text-teal-900/76" : "text-brand-800/74";

  return (
    <div
      className={`rounded-[1.4rem] border bg-gradient-to-b p-[18px] shadow-sm backdrop-blur-md sm:p-[22px] ${ring}`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${eyebrowColour}`}>{eyebrow}</p>
      <p className="mt-4 text-[15px] leading-relaxed text-brand-800">{body}</p>
    </div>
  );
}

function DashboardRibbon({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-brand-200/70 bg-white/95 px-5 py-[18px] shadow-sm ring-1 ring-brand-950/[0.04]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-500">{label}</p>
      <p className="mt-3 font-heading text-[1.35rem] font-semibold tabular-nums tracking-tight text-brand-950 sm:text-[1.52rem]">
        {value}
      </p>
      <p className="mt-2 text-[12.8px] leading-snug text-brand-600">{hint}</p>
    </div>
  );
}
