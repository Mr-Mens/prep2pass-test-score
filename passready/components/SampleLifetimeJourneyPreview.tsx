import { DashboardTrajectory } from "@/components/dashboard/DashboardTrajectory";
import { PRICING } from "@/lib/constants";
import { formatIsoDateUk } from "@/lib/formatting";
import type { JourneySnapshot } from "@/lib/dashboard/journey-types";
import type { WeakAreaId } from "@/lib/product-skill-map";

/** Illustrative only – mirrors the real lifetime dashboard arc for marketing sample. */
const SAMPLE_JOURNEY: JourneySnapshot[] = [
  {
    id: "sample-j1",
    created_at: "2026-01-12T14:30:00.000Z",
    readiness_score: 58,
    readiness_label: "Building Consistency",
    weak_areas: ["junctions", "mirrors"] as WeakAreaId[],
    mock_test_taken: true,
  },
  {
    id: "sample-j2",
    created_at: "2026-02-03T11:00:00.000Z",
    readiness_score: 63,
    readiness_label: "Building Consistency",
    weak_areas: ["junctions"] as WeakAreaId[],
    mock_test_taken: true,
  },
  {
    id: "sample-j3",
    created_at: "2026-03-18T16:45:00.000Z",
    readiness_score: 70,
    readiness_label: "Nearly Test Ready",
    weak_areas: ["mirrors"] as WeakAreaId[],
    mock_test_taken: true,
  },
  {
    id: "sample-j4",
    created_at: "2026-04-22T09:20:00.000Z",
    readiness_score: 76,
    readiness_label: "Nearly Test Ready",
    weak_areas: ["independentDriving"] as WeakAreaId[],
    mock_test_taken: true,
  },
];

const PREVIEW_USER_ID = "sample-lifetime-preview";

export function SampleLifetimeJourneyPreview() {
  const first = SAMPLE_JOURNEY[0]!;
  const best = SAMPLE_JOURNEY.reduce(
    (a, s) => (s.readiness_score > a.readiness_score ? s : a),
    SAMPLE_JOURNEY[0]!,
  );

  return (
    <section
      id="sample-lifetime-dashboard"
      aria-labelledby="sample-lifetime-heading"
      className="print:hidden mt-16 scroll-mt-8 rounded-[1.65rem] border-2 border-teal-300/50 bg-gradient-to-b from-teal-50/90 via-white to-brand-50/30 p-6 shadow-[0_16px_48px_-28px_rgba(15,118,110,0.18)] ring-1 ring-teal-800/[0.06] sm:p-8"
    >
      <div className="border-b border-teal-200/70 pb-6 sm:flex sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 id="sample-lifetime-heading" className="font-heading text-xl font-semibold tracking-tight text-brand-950 sm:text-2xl">
            Sample lifetime dashboard: readiness arc
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-600">
            This block is <span className="font-semibold text-brand-800">not</span> inside your one-off PDF-style report. It
            shows what your Pass Pilot dashboard looks like when you choose{" "}
            <span className="font-semibold text-brand-900">lifetime progress access</span> and save several Premium reports
            over time.
          </p>
        </div>
        <span className="mt-4 inline-flex shrink-0 self-start rounded-lg border border-teal-200/90 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 shadow-sm sm:mt-0">
          Add-on preview
        </span>
      </div>

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight text-brand-950 sm:text-xl">
        See how readiness moves between lessons
      </h3>
      <p className="mt-3 max-w-prose text-center text-sm leading-relaxed text-brand-600 sm:text-left">
        With lifetime access, each saved Premium report adds another point on your private timeline, with the same layout as your
        real dashboard. The curve below is{" "}
        <span className="font-semibold text-brand-800">illustrative</span> only.
      </p>

      <div className="relative mt-8 overflow-hidden rounded-[1.65rem] border border-teal-400/35 bg-gradient-to-br from-brand-950 via-[#171f2f] to-[#124943] p-5 shadow-[0_28px_60px_-24px_rgba(15,23,42,0.55)] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.38]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-[-28%] h-[280px] w-[280px] rounded-full bg-teal-400/10 blur-[100px]"
        />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/90">Readiness arc</p>
              <p className="mt-2 text-sm leading-snug text-slate-200">
                Each bubble is a saved report date. When routes or confidence shift, new assessments extend the story. No
                guesswork about whether you are actually improving.
              </p>
            </div>
            <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/90">
              {SAMPLE_JOURNEY.length} illustrative stints
            </p>
          </div>

          <DashboardTrajectory snapshotsChrono={SAMPLE_JOURNEY} userIdForIds={PREVIEW_USER_ID} />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/12 bg-black/25 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">First checkpoint</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-white">{formatIsoDateUk(first.created_at)}</p>
              <p className="mt-1 text-xs text-slate-400">Where the journal started</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/25 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">Personal best (sample)</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-white">{best.readiness_score}/100</p>
              <p className="mt-1 text-xs text-slate-400">{best.readiness_label}</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/25 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">Lift on this arc</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-200">
                +{best.readiness_score - first.readiness_score} pts
              </p>
              <p className="mt-1 text-xs text-slate-400">Earliest vs latest sample point</p>
            </div>
          </div>

          <p className="border-t border-white/10 pt-5 text-[13px] leading-relaxed text-slate-200">
            <span className="font-semibold text-white">Why learners choose lifetime.</span> Unlimited Premium reports on
            your email, a dated score history, and this arc on your real dashboard, so you and your instructor can agree what
            changed between lessons. One payment of {PRICING.lifetime.display} · no subscription.
          </p>
        </div>
      </div>
    </section>
  );
}
