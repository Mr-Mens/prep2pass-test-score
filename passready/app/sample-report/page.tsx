import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { PREMIUM_PRICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sample Premium TestReady Score Report",
  description:
    "Preview a realistic Premium TestReady Score Report from Prep2Pass before checkout — score, risks, next steps, coach note, and lesson focus.",
};

export default function SampleReportPage() {
  const sample = {
    readinessScore: 66,
    readinessLabel: "Nearly Ready",
    summary:
      "This sample learner shows solid lesson exposure but still has repeat risk patterns around observations at junctions and mirror routine under pressure. Confidence is improving, but consistency is not yet reliable enough for a high-certainty test outcome.",
    coachMessage:
      "You are close. For the next two weeks, focus on observation timing and mirror discipline on every route change. Consistency beats perfection.",
    riskAreas: [
      {
        group: "Observation, Signalling and Planning",
        severity: "high" as const,
        issues: [
          "Mirror checks before lane changes are occasionally skipped under pressure.",
          "Late planning when traffic density increases near junctions.",
        ],
      },
      {
        group: "Junctions, Roundabouts and Crossings",
        severity: "high" as const,
        issues: [
          "Emerging and approach timing need to stay consistent when routes get busy.",
        ],
      },
      {
        group: "Independent Driving",
        severity: "medium" as const,
        issues: [
          "Route decisions at complex roundabouts are safe but slightly hesitant.",
        ],
      },
      {
        group: "Manoeuvres",
        severity: "medium" as const,
        issues: [
          "Reverse bay parking: line control needs to stay consistent when traffic is nearby.",
          "Parallel parking: final positioning next to the kerb with enough clearance.",
        ],
      },
    ],
    nextSteps: [
      "Run two focused junction sessions with your instructor, prioritising early observation timing.",
      "Use a verbal mirror routine on every pull-away and lane adjustment until automatic.",
      "Complete one full mock in your test area and review only the faults that repeat.",
      "Schedule one confidence-maintenance drive close to test week.",
    ],
    recommendedHours: "4-8 focused hours, including one mock test.",
  };

  const badgeClass =
    sample.readinessLabel === "Nearly Ready"
      ? "bg-amber-50 text-amber-950 ring-amber-200"
      : "bg-teal-50 text-teal-950 ring-teal-200";

  function severityClass(s: "high" | "medium" | "low") {
    if (s === "high") return "bg-red-50 text-red-900 ring-red-200";
    if (s === "medium") return "bg-amber-50 text-amber-950 ring-amber-200";
    return "bg-brand-50 text-brand-800 ring-brand-200";
  }

  return (
    <Section
      className="bg-brand-50 print:bg-white"
      contentClassName="max-w-3xl"
      eyebrow="Preview"
      title="Sample Premium TestReady Score Report"
      subtitle="Illustrative example — your paid report follows the same structure."
    >
      <div className="space-y-8 print:space-y-4">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card print:shadow-none">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-600">Readiness score</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-brand-950">
                {sample.readinessScore}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass}`}
            >
              {sample.readinessLabel}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-brand-800">{sample.summary}</p>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-6 shadow-card print:shadow-none">
          <h2 className="text-lg font-semibold text-teal-950">Coach note</h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-900">{sample.coachMessage}</p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card print:shadow-none sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">
            Your Test Risk Areas (Based on Driving Skills Framework)
          </h2>
          <p className="mt-2 text-xs text-brand-500">
            Grouped using common practical test skill themes — not affiliated with DVSA.
          </p>
          <div className="mt-6 space-y-5">
            {sample.riskAreas.map((block) => (
              <div
                key={block.group}
                className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-brand-950">{block.group}</h3>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${severityClass(
                      block.severity,
                    )}`}
                  >
                    {block.severity} risk
                  </span>
                </div>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-800">
                  {block.issues.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card print:shadow-none sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">Next steps</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-brand-700">
            {sample.nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="mt-4 text-sm font-medium text-brand-800">
            Recommended lesson guidance: {sample.recommendedHours}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm text-amber-950">
          <p className="font-semibold">Example disclaimer</p>
          <p className="mt-2">
            This sample is illustrative only. Prep2Pass is not DVSA guidance and does not guarantee
            pass/fail outcomes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/assessment" className="w-full sm:w-auto">
            Get My TestReady Score
          </Button>
          <Button href="/" variant="secondary" className="w-full sm:w-auto">
            Back to home
          </Button>
        </div>
        <p className="text-xs text-brand-500">
          Premium TestReady Score Report · {PREMIUM_PRICE} one-time.
        </p>
      </div>
    </Section>
  );
}
