import Link from "next/link";

import { BRAND_CTA } from "@/lib/constants";
import { buildTestCountdownPlan, saltFromReportId } from "@/lib/test-countdown-plan";

type Props = {
  testDate: string;
  reportId: string;
  mockTestTaken: boolean;
};

function daysLabel(days: number): string {
  if (days < 0) return "Date has passed";
  if (days === 0) return "Today";
  if (days === 1) return "1 day away";
  return `${days} days away`;
}

export function TestCountdownPlanSection({ testDate, reportId, mockTestTaken }: Props) {
  const plan = buildTestCountdownPlan({
    testDate,
    salt: saltFromReportId(reportId),
    mockTestTaken,
  });
  if (!plan) return null;

  return (
    <section className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-brand-950">Test countdown plan</h2>
      <p className="mt-2 text-sm text-brand-700">
        <span className="font-semibold text-brand-950">{plan.dateLabel}</span>
        <span className="text-brand-600"> · {daysLabel(plan.daysRemaining)}</span>
      </p>
      <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-brand-800">
        {plan.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-brand-500">
        From your latest saved report.{" "}
        <Link href="/assessment" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
          {BRAND_CTA.getUpdatedScore}
        </Link>{" "}
        if your test date changed.
      </p>
    </section>
  );
}
