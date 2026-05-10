import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { formatFaultRowCompositeId } from "@/lib/instructor/mock-test-labels";
import type { MockTestSummary } from "@/lib/instructor/types";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getMockTestForInstructor } from "@/lib/server/repositories/instructor-mock-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export default async function InstructorMockTestSummaryPage({ params }: { params: { id: string } }) {
  const user = await requireInstructorSession();
  if (!isSupabaseConfigured()) notFound();
  const row = await getMockTestForInstructor(params.id, user.id);
  if (!row) notFound();
  if (row.status === "draft") {
    redirect(`/instructor/mock-test/new?id=${params.id}`);
  }

  const meta = row.summary_json as { summary?: MockTestSummary; failReason?: string | null } | null;
  const summary = meta?.summary;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/instructor/mock-tests"
          className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          ← All mock tests
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Mock test summary</h1>
        <p className="mt-2 text-sm text-brand-600">
          DVSA-style mock test outcome — independent tool, not affiliated with DVSA.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Candidate</h2>
        <p className="mt-2 text-lg font-semibold text-brand-950">{row.pupil_name_snapshot?.trim() || "—"}</p>
        <p className="text-sm text-brand-600">{row.pupil_email_snapshot || "—"}</p>
      </section>

      <section
        className={`rounded-2xl border p-6 shadow-sm ${
          row.outcome === "pass"
            ? "border-emerald-200 bg-emerald-50/80"
            : row.outcome === "fail"
              ? "border-red-200 bg-red-50/80"
              : "border-amber-200 bg-amber-50/80"
        }`}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Outcome</h2>
        <p className="mt-2 text-3xl font-bold capitalize tracking-tight text-brand-950">{row.outcome}</p>
        {row.fail_reason ? <p className="mt-3 text-sm text-brand-800">{row.fail_reason}</p> : null}
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-600">Driving faults (minors)</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-brand-950">{row.minor_fault_count}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-600">Minor threshold used</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-brand-950">{row.minor_fault_threshold}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-600">Serious</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-brand-950">{row.serious_fault_count}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-600">Dangerous</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-brand-950">{row.dangerous_fault_count}</dd>
          </div>
        </dl>
      </section>

      {summary ? (
        <>
          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Top risk areas</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-brand-800">
              {summary.weakRowIds.slice(0, 8).map((id) => (
                <li key={id}>{formatFaultRowCompositeId(id)}</li>
              ))}
              {summary.weakRowIds.length === 0 ? <li className="list-none text-brand-500">No faults recorded.</li> : null}
            </ul>
          </section>

          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Weak categories</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {summary.weakCategories.map((c) => (
                <li
                  key={c}
                  className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-900 ring-1 ring-brand-200"
                >
                  {c}
                </li>
              ))}
              {summary.weakCategories.length === 0 ? <li className="text-sm text-brand-500">—</li> : null}
            </ul>
          </section>

          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Suggested improvement priorities</h2>
            <ul className="mt-4 list-inside list-decimal space-y-2 text-sm text-brand-800">
              {summary.suggestedFocus.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
              {summary.suggestedFocus.length === 0 ? <li className="list-none text-brand-500">—</li> : null}
            </ul>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Fault descriptions</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
          {row.form_payload.postTest?.faultDescriptions?.trim() ||
            (row.form_payload as { faultDescriptions?: string }).faultDescriptions?.trim() ||
            "—"}
        </p>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Instructor notes</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
          {row.form_payload.instructorNotes?.trim() || "—"}
        </p>
      </section>

      <div className="flex flex-wrap gap-3 pb-8">
        <Link
          href={`/instructor/mock-test/new?id=${row.id}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
        >
          Edit mock test
        </Link>
        <Link
          href="/instructor/mock-test/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          New mock test
        </Link>
      </div>
    </div>
  );
}
