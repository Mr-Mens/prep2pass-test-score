import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardTrajectory } from "@/components/dashboard/DashboardTrajectory";
import { ScoreRingGauge } from "@/components/learner/ScoreRingGauge";
import { SITE } from "@/lib/constants";
import { deriveDeltaVsPrior, deriveFocusArea, deriveNextMilestone } from "@/lib/dashboard/journey-insights";
import { formatCompactDateUk, formatIsoDateUk } from "@/lib/formatting";
import { listJourneySnapshotsByUserId } from "@/lib/server/repositories/reports-repository";
import { getServerAuthUser } from "@/lib/supabase/server";
import type { WeakAreaId } from "@/lib/product-skill-map";
import { WEAK_AREA_OPTIONS } from "@/lib/product-skill-map";

export const metadata: Metadata = {
  title: "Progress",
  description: `Track your Test Ready Score history on ${SITE.name}.`,
};

function labelWeak(id: WeakAreaId): string {
  return WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function describeWeakChange(prev: WeakAreaId[] | undefined, curr: WeakAreaId[] | undefined): string | null {
  if (!curr?.length) return "Your latest report did not flag specific weak areas.";
  const p = new Set(prev ?? []);
  const c = new Set(curr);
  const added = curr.filter((x) => !p.has(x));
  const dropped = Array.from(p).filter((x) => !c.has(x));
  if (!added.length && !dropped.length) return null;
  const parts: string[] = [];
  if (added.length) parts.push(`New focus surfaced: ${added.map(labelWeak).join(", ")}`);
  if (dropped.length) parts.push(`Less emphasis now on: ${dropped.map(labelWeak).join(", ")}`);
  return parts.join(" · ");
}

export default async function LearnerProgressPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/login?next=%2Fprogress");
  if (!user.emailConfirmedAt) redirect(`/verify-email?next=${encodeURIComponent("/progress")}`);

  const snaps = await listJourneySnapshotsByUserId(user.id);
  const latest = snaps.length ? snaps[snaps.length - 1]! : null;
  const prev = snaps.length >= 2 ? snaps[snaps.length - 2]! : null;
  const delta = deriveDeltaVsPrior(snaps);
  const weakNarrative = prev && latest ? describeWeakChange(prev.weak_areas, latest.weak_areas) : null;
  const nextPriority = deriveNextMilestone(latest);
  const focus = deriveFocusArea(latest);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">Progress</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Quiet timeline of Premium reports — score direction, recurring themes, and what to practise next.
        </p>
      </div>

      {latest ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Latest score</p>
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
            <ScoreRingGauge score={latest.readiness_score} size={164} slim className="shrink-0" />
            <div className="w-full flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-end justify-center gap-6 sm:justify-start">
                <div className="text-center sm:text-left">
                  <p className="font-heading text-3xl font-semibold tabular-nums text-brand-950 sm:text-4xl">
                    {latest.readiness_score}
                    <span className="text-xl text-brand-400">/100</span>
                  </p>
                  <p className="mt-1 text-xs text-brand-500">{formatIsoDateUk(latest.created_at)}</p>
                </div>
                {prev ? (
                  <div className="text-center sm:text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Previous</p>
                    <p className="font-heading text-2xl font-semibold tabular-nums text-brand-800">{prev.readiness_score}</p>
                    <p className="text-[11px] text-brand-500">{formatCompactDateUk(prev.created_at)}</p>
                  </div>
                ) : null}
              </div>
              <p className="mt-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-900 ring-1 ring-brand-100">
                {latest.readiness_label}
              </p>
              {delta !== null && delta !== 0 ? (
                <p className={`mt-4 text-base font-semibold ${delta > 0 ? "text-emerald-700" : "text-amber-800"}`}>
                  {delta > 0
                    ? `Improvement +${delta} points vs previous report.`
                    : `${delta} points vs previous report — normal variance between routes.`}
                </p>
              ) : snaps.length >= 2 ? (
                <p className="mt-4 text-sm font-medium text-brand-600">Holding steady between your last two saved checkpoints.</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-brand-200 bg-white/80 p-8 text-center text-sm leading-relaxed text-brand-700">
          Save your first Premium report and we chart every next visit here automatically.
          <Link href="/assessment" className="mt-4 inline-flex min-h-[48px] items-center justify-center text-base font-semibold text-teal-800 underline-offset-4 hover:underline">
            Start assessment
          </Link>
        </section>
      )}

      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-950">Arc across reports</h2>
        <p className="mt-2 text-sm text-brand-600">Smoothed line between saved Premium checkpoints (oldest to newest).</p>
        <div className="mt-6 rounded-2xl border border-brand-950/60 bg-gradient-to-b from-brand-950 via-brand-950 to-[#155e59] px-4 py-5 shadow-inner shadow-black/40">
          <DashboardTrajectory snapshotsChrono={snaps} userIdForIds={user.id} />
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-brand-950">What changed?</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-brand-800">
          {weakNarrative ? (
            <p>{weakNarrative}</p>
          ) : snaps.length >= 2 ? (
            <p>Risk-area flags have been consistent across your last stretches — refinement is about polish, not new surprises.</p>
          ) : (
            <p>Once you have two or more checkpoints, we compare weak-area tags between reports here.</p>
          )}
          {delta !== null && snaps.length >= 2 ? (
            <p className="text-brand-700">
              Score movement:{" "}
              <span className="font-semibold tabular-nums">
                {prev?.readiness_score} → {latest?.readiness_score}
              </span>
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-teal-100 bg-teal-50/35 p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-teal-950">Next priority</h2>
        <p className="mt-4 text-sm leading-relaxed text-brand-900">{nextPriority}</p>
        {focus ? (
          <p className="mt-4 rounded-2xl border border-teal-200/70 bg-white/80 p-4 text-sm leading-relaxed text-brand-800">{focus}</p>
        ) : null}
      </section>

      <div className="rounded-2xl bg-brand-950 p-6 text-center shadow-lg sm:p-8">
        <p className="text-sm font-medium text-teal-100">Keep the journal honest.</p>
        <Link
          href="/assessment"
          className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-teal-400 px-6 text-base font-semibold text-brand-950 shadow-md transition hover:bg-teal-300"
        >
          Start new assessment
        </Link>
        <Link
          href="/my-reports"
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/20 bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10"
        >
          Track saved reports
        </Link>
      </div>
    </div>
  );
}
