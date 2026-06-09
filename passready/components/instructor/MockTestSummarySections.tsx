import { formatFaultRowCompositeId } from "@/lib/instructor/mock-test-labels";
import type { MockTestFormPayload } from "@/lib/instructor/mock-test-schemas";
import type { MockTestSummary } from "@/lib/instructor/types";
import type { MockTestRow } from "@/lib/server/repositories/instructor-mock-repository";

type Props = {
  row: MockTestRow;
  summary: MockTestSummary | null | undefined;
  failReason?: string | null;
  showCandidate?: boolean;
};

export function MockTestSummarySections({ row, summary, failReason, showCandidate = true }: Props) {
  const formPayload = row.form_payload as MockTestFormPayload;

  return (
    <>
      {showCandidate ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Candidate</h2>
          <p className="mt-2 text-lg font-semibold text-brand-950">{row.pupil_name_snapshot?.trim() || "Not set"}</p>
          <p className="text-sm text-brand-600">{row.pupil_email_snapshot || "Not set"}</p>
        </section>
      ) : null}

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
        {(failReason ?? row.fail_reason) ? (
          <p className="mt-3 text-sm text-brand-800">{failReason ?? row.fail_reason}</p>
        ) : null}
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
              {summary.weakCategories.length === 0 ? <li className="text-sm text-brand-500">None recorded</li> : null}
            </ul>
          </section>

          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Suggested improvement priorities</h2>
            <ul className="mt-4 list-inside list-decimal space-y-2 text-sm text-brand-800">
              {summary.suggestedFocus.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
              {summary.suggestedFocus.length === 0 ? <li className="list-none text-brand-500">None recorded</li> : null}
            </ul>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Fault descriptions</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
          {formPayload.postTest?.faultDescriptions?.trim() ||
            (formPayload as { faultDescriptions?: string }).faultDescriptions?.trim() ||
            "None recorded"}
        </p>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Instructor notes</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
          {formPayload.instructorNotes?.trim() || "None recorded"}
        </p>
      </section>
    </>
  );
}
