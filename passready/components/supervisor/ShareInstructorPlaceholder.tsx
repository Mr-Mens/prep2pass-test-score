import Link from "next/link";

export function ShareInstructorPlaceholder() {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Share with instructor</p>
          <h2 className="mt-2 font-heading text-lg font-semibold text-brand-950">Coming soon</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-600">
            You will soon be able to share practice logs, progress summaries, and focus areas with your learner&apos;s
            driving instructor, with your learner&apos;s consent.
          </p>
        </div>
        <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          Coming Soon
        </span>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-brand-700">
        <li>· Share private practice logs</li>
        <li>· Share readiness summaries between lessons</li>
        <li>· Highlight agreed focus areas for the next lesson</li>
      </ul>
      <Link
        href="/supervisor/share"
        className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
      >
        Learn more
      </Link>
    </section>
  );
}
