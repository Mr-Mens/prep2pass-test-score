/** Static marketing preview aligned with Premium report visuals (not live data). */
export function HomeReportPreview() {
  const progressPoints = [58, 64, 68, 72];

  return (
    <div className="rounded-2xl border border-brand-200/70 bg-white p-6 shadow-card ring-1 ring-black/[0.02] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-brand-100 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Readiness score</p>
          <p className="mt-2 font-heading text-4xl font-semibold tabular-nums tracking-tight text-brand-950 sm:text-5xl">
            72<span className="text-2xl font-semibold text-brand-400">/100</span>
          </p>
          <p className="mt-2 text-sm font-medium text-teal-900">Nearly Test Ready</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Lesson-hour estimate</p>
          <p className="mt-1 text-base font-semibold text-brand-950">8–12 hours</p>
          <p className="mt-1 text-xs leading-snug text-brand-600">Indicative range for planning with your instructor</p>
        </div>
      </div>

      <div className="grid gap-6 pt-6 md:grid-cols-5 md:gap-8">
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Progress over time</p>
          <p className="mt-4 text-[11px] text-brand-500">Example timeline (lifetime)</p>
          <div className="mt-3 flex h-28 items-end justify-between gap-2 border-b border-brand-100 pb-px px-1">
            {progressPoints.map((v, i) => (
              <div key={`${v}-${i}`} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full max-w-[2.75rem] rounded-t-md bg-teal-500/85 transition-all"
                  style={{ height: `${(v / 100) * 5.25}rem`, minHeight: "1.5rem" }}
                  aria-hidden
                />
                <span className="text-[10px] font-medium tabular-nums text-brand-500">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Risk areas (sample)</p>
          <ul className="mt-4 space-y-3">
            {[
              { label: "Roundabouts", level: "High risk" },
              { label: "Observations & mirrors", level: "Moderate risk" },
              { label: "Junction planning", level: "Moderate risk" },
            ].map((row) => (
              <li
                key={row.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/35 px-4 py-3"
              >
                <span className="text-sm font-medium text-brand-950">{row.label}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-800 ring-1 ring-brand-200">
                  {row.level}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 border-t border-brand-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Focused action plan</p>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-brand-800">
          <li className="flex gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden />
            One roundabout-focused session with verbal MSPSL on every approach.
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden />
            Ten-minute junction planning drill until timing feels early, not late.
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden />
            Repeat mock section in your test area and review only recurring faults.
          </li>
        </ul>
      </div>
    </div>
  );
}
