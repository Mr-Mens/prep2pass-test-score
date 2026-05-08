import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { EstimatedLessonHoursBlock } from "@/components/EstimatedLessonHoursBlock";
import { ReportSummaryDebrief } from "@/components/ReportSummaryDebrief";
import { RiskAreasSection } from "@/components/RiskAreasSection";
import { Section } from "@/components/Section";
import { PRICING } from "@/lib/constants";
import {
  buildRecommendedHoursNarrative,
  computeEstimatedLessonHours,
  type EstimatedHoursInput,
} from "@/lib/estimated-lesson-hours";
import { sortGroupedRiskAreasByImpact, type GroupedRiskArea } from "@/lib/readiness-risk-areas";

export const metadata: Metadata = {
  title: "Sample Premium Test Ready Score Report",
  description:
    "Preview a realistic Premium Test Ready Score report from Prep2Pass before checkout: score, risks, next steps, coach note, and lesson focus. Created by a DVSA-approved driving instructor.",
};

const sampleRiskAreas: GroupedRiskArea[] = [
  {
    groupKey: "observation_signalling_planning",
    groupLabel: "Observation, signalling and planning",
    severity: "high" as const,
    skills: [
      {
        key: "mirrors",
        label: "Mirrors",
        officialSkillId: 8,
        officialSkillName: "Mirrors – vision and use",
      },
    ],
    summary:
      "Front-load test prep: Mirrors & MSPSL, with short timed repeats until each look is spoken before you signal or change speed.",
    highlights: [
      "Late planning when traffic density increases near junctions.",
    ],
  },
  {
    groupKey: "junctions_roundabouts_crossings",
    groupLabel: "Junctions, roundabouts and crossings",
    severity: "high" as const,
    skills: [
      {
        key: "junctions",
        label: "Junctions",
        officialSkillId: 14,
        officialSkillName: "Junctions",
      },
    ],
    summary:
      "Junctions · Roundabouts: one narrow win per week. Keep the same approach speed until emerging feels boring, then add traffic.",
  },
  {
    groupKey: "following_routes",
    groupLabel: "Following routes",
    severity: "moderate",
    skills: [
      {
        key: "independentDriving",
        label: "Independent driving",
        officialSkillId: 27,
        officialSkillName: "Independent driving and using a sat nav",
      },
    ],
    summary:
      "Independent driving: narrate the next two decisions early on sat-nav or sign routes so lane choice never surprises you.",
  },
  {
    groupKey: "manoeuvres",
    groupLabel: "Manoeuvres",
    severity: "moderate",
    skills: [
      {
        key: "reverseBayParking",
        label: "Reverse bay parking",
        officialSkillId: 19,
        officialSkillName: "Parking",
      },
      {
        key: "parallelParking",
        label: "Parallel parking",
        officialSkillId: 19,
        officialSkillName: "Parking",
      },
    ],
    summary:
      "Reverse bay parking · Parallel parking: same slow-speed mirror pattern on both. Control first, lines second.",
  },
];

/** Illustrates full path: mock taken so hours follow score-driven logic. */
const sampleHoursInput: EstimatedHoursInput = {
  lessonsTaken: 28,
  mockTestTaken: "yes",
  mockTestResult: "fail",
  seriousFaults: 0,
  drivingFaults: 6,
  weakAreas: ["mirrors", "junctions", "independentDriving", "reverseBayParking", "parallelParking"],
  confidenceLevel: 6,
};

export default function SampleReportPage() {
  const sampleCore = {
    readinessScore: 66,
    readinessLabel: "Nearly Test Ready" as const,
    summary:
      "This sample learner shows solid lesson exposure but still has repeat risk patterns around observations at junctions and mirror routine under pressure. Confidence is improving, but consistency is not yet reliable enough for a high-certainty test outcome.",
    coachMessage:
      "You are close. For the next two weeks, focus on observation timing and mirror discipline on every route change. Consistency beats perfection.",
    nextSteps: [
      "Run two focused junction sessions with your instructor, prioritising early observation timing.",
      "Use a verbal mirror routine on every pull-away and lane adjustment until automatic.",
      "Complete one full mock in your test area and review only the faults that repeat.",
      "Schedule one confidence-maintenance drive close to test week.",
    ],
  };

  const sampleEstimatedHours = computeEstimatedLessonHours(sampleHoursInput, sampleCore.readinessScore);
  const sample = {
    ...sampleCore,
    recommendedHours: buildRecommendedHoursNarrative(sampleEstimatedHours, 42),
  };

  const badgeClass =
    sample.readinessLabel === "Nearly Test Ready"
      ? "bg-sky-50 text-sky-950 ring-sky-200"
      : sample.readinessLabel === "Building Consistency"
        ? "bg-amber-50 text-amber-950 ring-amber-200"
        : sample.readinessLabel === "Needs More Time"
          ? "bg-red-50 text-red-900 ring-red-200"
          : "bg-teal-50 text-teal-950 ring-teal-200";

  return (
    <Section
      className="bg-brand-50 print:bg-white"
      contentClassName="max-w-3xl"
      eyebrow="Preview"
      title="Sample Premium Test Ready Score report"
      subtitle="Illustrative example. Your paid report follows the same layout: score, risks, action plan, coach note, and lesson-hour estimate — saved to your secure account after checkout."
    >
      <div className="space-y-8 print:space-y-4">
        <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02] print:border-brand-200 print:shadow-none print:ring-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-600/90">Readiness score</p>
              <p className="mt-2 font-heading text-5xl font-semibold tabular-nums tracking-tight text-brand-950">
                {sample.readinessScore}
                <span className="text-3xl font-semibold text-brand-400">/100</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass}`}
            >
              {sample.readinessLabel}
            </span>
          </div>
          <ReportSummaryDebrief className="mt-6">
            <p>{sample.summary}</p>
          </ReportSummaryDebrief>
        </div>

        <div className="rounded-2xl border border-teal-200/80 bg-teal-50/80 p-6 shadow-card ring-1 ring-teal-200/45 print:border-teal-200 print:shadow-none print:ring-0">
          <h2 className="text-lg font-semibold text-teal-950">Coach note</h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-900">{sample.coachMessage}</p>
        </div>

        <RiskAreasSection blocks={sortGroupedRiskAreasByImpact(sampleRiskAreas)} compact />

        <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02] print:shadow-none print:ring-0 sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">Next steps</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-brand-700">
            {sample.nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <div className="mt-6">
            <EstimatedLessonHoursBlock hours={sampleEstimatedHours} />
          </div>
          <p className="mt-6 text-sm font-medium text-brand-800">
            Recommended lesson guidance: {sample.recommendedHours}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm text-amber-950">
          <p className="font-semibold">Example disclaimer</p>
          <p className="mt-2">
            This sample is illustrative only. Prep2Pass is independent and not affiliated with DVSA. It is created by a
            DVSA-approved driving instructor, is not official DVSA guidance, and does not guarantee pass or fail
            outcomes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            href="/assessment"
            variant="conversion"
            className="w-full sm:w-auto sm:min-w-[12rem]"
          >
            Get My Test Ready Score
          </Button>
          <Button href="/" variant="secondary" className="w-full min-h-[48px] sm:w-auto">
            Back to home
          </Button>
        </div>
        <p className="text-xs text-brand-500/90">
          Premium Test Ready Score report · {PRICING.single.display} one-off · {PRICING.lifetime.display} lifetime
          progress access · Secure checkout via Stripe
        </p>
      </div>
    </Section>
  );
}
