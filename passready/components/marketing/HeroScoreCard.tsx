import Link from "next/link";

const focusAreas = ["Roundabouts", "Junction planning", "Observations"] as const;

export function HeroScoreCard() {
  return (
    <div
      className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-gradient-to-br from-white via-white to-teal-50/40 p-6 shadow-[0_32px_64px_-24px_rgba(15,40,54,0.35),inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-brand-950/[0.04] sm:p-8"
      role="group"
      aria-label="Example Test Ready Score Report preview"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-200/30 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-400">Sample report</p>
        <div className="mt-4 flex items-end gap-3">
          <p className="font-heading text-6xl font-semibold tabular-nums leading-none tracking-tight text-brand-950 sm:text-7xl">
            72
          </p>
          <div className="pb-1.5">
            <p className="text-sm font-semibold text-brand-700">Test Ready Score</p>
            <p className="text-xs text-brand-500">out of 100</p>
          </div>
        </div>
        <span className="mt-4 inline-flex rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-teal-950 ring-1 ring-teal-200/80">
          Nearly Test Ready
        </span>

        <div className="mt-6 space-y-4 border-t border-brand-100/90 pt-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Estimated</p>
            <p className="mt-1 text-base font-semibold text-brand-950">8–12 guided hours remaining</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Top focus areas</p>
            <ul className="mt-2 space-y-1.5">
              {focusAreas.map((area) => (
                <li key={area} className="flex items-center gap-2 text-sm text-brand-800">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden />
                  {area}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-brand-500">
              <span>Progress</span>
              <span className="tabular-nums text-brand-700">72%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-teal-500 to-teal-600" aria-hidden />
            </div>
          </div>
        </div>

        <Link
          href="/sample-report"
          className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl border border-brand-200 bg-white text-sm font-semibold text-brand-900 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50"
        >
          View Sample Report
        </Link>
      </div>
    </div>
  );
}
