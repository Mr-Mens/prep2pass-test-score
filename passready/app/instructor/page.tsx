import Link from "next/link";

export default function InstructorDashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Instructor dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-600">
          Run DVSA-style mock tests, track pupils, and review outcomes — built into Test Ready Score. This workspace is
          independent and not affiliated with DVSA.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/instructor/mock-test/new"
          className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Mock test</p>
          <p className="mt-2 text-lg font-semibold text-brand-950">Start new mock test</p>
          <p className="mt-2 text-sm text-brand-600">Structured form with live pass/fail and fault chips.</p>
          <p className="mt-4 text-sm font-semibold text-teal-700 group-hover:underline">Open tool →</p>
        </Link>
        <Link
          href="/instructor/pupils"
          className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Pupils</p>
          <p className="mt-2 text-lg font-semibold text-brand-950">My pupils</p>
          <p className="mt-2 text-sm text-brand-600">Save pupils and link by email where possible.</p>
          <p className="mt-4 text-sm font-semibold text-teal-700 group-hover:underline">Manage →</p>
        </Link>
        <Link
          href="/instructor/mock-tests"
          className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">History</p>
          <p className="mt-2 text-lg font-semibold text-brand-950">Mock test reports</p>
          <p className="mt-2 text-sm text-brand-600">Drafts and completed sessions with outcomes.</p>
          <p className="mt-4 text-sm font-semibold text-teal-700 group-hover:underline">View list →</p>
        </Link>
        <Link
          href="/instructor/diagrams"
          className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Diagrams</p>
          <p className="mt-2 text-lg font-semibold text-brand-950">Teaching diagrams</p>
          <p className="mt-2 text-sm text-brand-600">Placeholder library — more coming soon.</p>
          <p className="mt-4 text-sm font-semibold text-teal-700 group-hover:underline">Browse →</p>
        </Link>
      </div>
    </div>
  );
}
