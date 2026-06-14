const focusItems = ["Right-turn positioning", "Parallel parking", "Sat nav driving"] as const;

export function TestCountdownPreview() {
  return (
    <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/30 to-teal-50/40 p-6 shadow-card ring-1 ring-brand-50 sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">Test countdown</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600">Test booked</p>
          <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-brand-950">23 June 2026</p>
        </div>
        <div className="rounded-xl bg-teal-600 px-4 py-2 text-center shadow-sm">
          <p className="text-2xl font-bold tabular-nums leading-none text-white">12</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-100">days left</p>
        </div>
      </div>
      <div className="mt-6 border-t border-brand-100 pt-6">
        <p className="text-sm font-semibold text-brand-950">Recommended focus</p>
        <ul className="mt-3 space-y-2">
          {focusItems.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-brand-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-800">
                →
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-brand-500">
        Test Ready Score helps you focus on the right things before test day.
      </p>
    </div>
  );
}
