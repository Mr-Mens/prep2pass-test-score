import { mergeMockTestPayload } from "@/lib/instructor/mock-test-defaults";
import { resolveMockTestSummary } from "@/lib/instructor/mock-test-scoring";
import type { MockTestSummary, MockTestTopRiskAreas } from "@/lib/instructor/types";
import type { MockTestRow } from "@/lib/server/repositories/instructor-mock-repository";

type Props = {
  row: MockTestRow;
  summary: MockTestSummary | null | undefined;
  failReason?: string | null;
  showCandidate?: boolean;
};

function RiskAreaList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: MockTestTopRiskAreas[keyof MockTestTopRiskAreas];
  emptyLabel: string;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-600">{title}</h3>
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-brand-800">
        {items.map((item) => (
          <li key={item.compositeId}>{item.displayLabel}</li>
        ))}
        {items.length === 0 ? <li className="list-none text-brand-500">{emptyLabel}</li> : null}
      </ul>
    </div>
  );
}

export function MockTestSummarySections({ row, summary, failReason, showCandidate = true }: Props) {
  const formPayload = mergeMockTestPayload(row.form_payload);
  const resolvedSummary = resolveMockTestSummary(formPayload, row.minor_fault_threshold, summary);
  const { topRiskAreas } = resolvedSummary;
  const hasAnyRisk =
    topRiskAreas.dangerous.length + topRiskAreas.serious.length + topRiskAreas.driving.length > 0;

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

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Top risk areas</h2>
        <div className="mt-6 space-y-6">
          <RiskAreaList title="Dangerous faults" items={topRiskAreas.dangerous} emptyLabel="None recorded" />
          <RiskAreaList title="Serious faults" items={topRiskAreas.serious} emptyLabel="None recorded" />
          <RiskAreaList title="Driving faults" items={topRiskAreas.driving} emptyLabel="None recorded" />
        </div>
        {!hasAnyRisk ? <p className="mt-4 text-sm text-brand-500">No faults recorded.</p> : null}
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Weak categories</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {resolvedSummary.weakCategories.map((c) => (
            <li
              key={c}
              className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-900 ring-1 ring-brand-200"
            >
              {c}
            </li>
          ))}
          {resolvedSummary.weakCategories.length === 0 ? (
            <li className="text-sm text-brand-500">None recorded</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Suggested improvement priorities</h2>
        <ul className="mt-4 list-inside list-decimal space-y-2 text-sm text-brand-800">
          {resolvedSummary.suggestedFocus.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
          {resolvedSummary.suggestedFocus.length === 0 ? (
            <li className="list-none text-brand-500">None recorded</li>
          ) : null}
        </ul>
      </section>

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
