/** Static marketing preview, concise list of report sections (not live data). */
export function HomeReportPreview() {
  const sections = [
    { title: "Readiness score", detail: "Clear score out of 100 with a readiness band." },
    { title: "Risk areas", detail: "Highest-risk skills grouped for test day." },
    { title: "Action plan", detail: "Focused next steps for lessons and practice." },
    { title: "Estimated guided hours", detail: "Realistic range to plan with your instructor." },
    { title: "Learning roadmap", detail: "Syllabus themes covered versus still to practise." },
  ] as const;

  return (
    <div className="rounded-2xl border border-brand-200/70 bg-white p-6 shadow-card ring-1 ring-black/[0.02] sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-100 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Example report</p>
          <p className="mt-2 font-heading text-4xl font-semibold tabular-nums tracking-tight text-brand-950">
            72<span className="text-2xl font-semibold text-brand-400">/100</span>
          </p>
          <p className="mt-2 text-sm font-medium text-teal-900">Nearly Test Ready</p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 ring-1 ring-teal-200">
          Premium report
        </span>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <li
            key={s.title}
            className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-4"
          >
            <p className="text-sm font-semibold text-brand-950">{s.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{s.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
