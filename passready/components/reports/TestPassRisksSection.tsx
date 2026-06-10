import type { TestPassRiskItem } from "@/lib/report-insights";
import { testRisksSourceCaption } from "@/lib/report-reasoning";
import type { AssessmentPayload } from "@/lib/validation";

type Props = {
  risks: TestPassRiskItem[];
  mockTestTaken?: AssessmentPayload["mockTestTaken"];
};

export function TestPassRisksSection({ risks, mockTestTaken = "no" }: Props) {
  if (risks.length === 0) return null;

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Your most likely test risks</p>
      <h2 className="mt-2 text-lg font-semibold text-brand-950">Most likely faults if tested tomorrow</h2>
      <p className="mt-2 max-w-prose text-sm text-brand-600">
        {testRisksSourceCaption(mockTestTaken)}
      </p>
      <div className="mt-6 space-y-4">
        {risks.map((risk) => (
          <article
            key={risk.id}
            className={`rounded-xl border p-4 sm:p-5 ${
              risk.severity === "high"
                ? "border-red-200/80 bg-red-50/35"
                : "border-amber-200/80 bg-amber-50/35"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-brand-950">{risk.faultArea}</h3>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                  risk.severity === "high"
                    ? "bg-red-50 text-red-900 ring-red-200"
                    : "bg-amber-50 text-amber-950 ring-amber-200"
                }`}
              >
                {risk.severity === "high" ? "Higher risk" : "Watch area"}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-brand-800">Why it matters</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-700">{risk.whyItMatters}</p>
            <p className="mt-3 text-sm font-medium text-brand-800">What to practise</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-700">{risk.practiceNext}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
