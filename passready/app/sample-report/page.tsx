import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { PremiumReportSections } from "@/components/reports/PremiumReportSections";
import { SampleLifetimeJourneyPreview } from "@/components/SampleLifetimeJourneyPreview";
import { Section } from "@/components/Section";
import { BRAND_CTA, PRICING } from "@/lib/constants";
import { buildRecommendedHoursNarrative, type EstimatedHoursInput } from "@/lib/estimated-lesson-hours";
import { buildReportViewModel } from "@/lib/report-view-model";
import { sortGroupedRiskAreasByImpact, type GroupedRiskArea } from "@/lib/readiness-risk-areas";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = {
  title: "Sample Premium Test Ready Score Report",
  description:
    "Preview a realistic Premium Test Ready Score Report from Pass Pilot before checkout: score, risks, next steps, coach note, and lesson focus. Created by a DVSA-approved driving instructor.",
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

export default async function SampleReportPage() {
  await redirectIfAuthenticated();

  const sampleCore = {
    readinessScore: 66,
    readinessLabel: "Nearly Test Ready" as const,
    summary:
      "Alex, you are nearly test ready. Your vehicle control is steady and you have covered a good range of driving, but consistency at junctions is still the main thing holding you back, especially your observations and decision-making when emerging. Before your test, prioritise emerging, right turns, and busier junctions, then move towards mock-test style drives nearer the day.",
    nextSteps: [
      "Run two focused junction sessions with your instructor, prioritising early observation timing.",
      "Use a verbal mirror routine on every pull-away and lane adjustment until automatic.",
      "Complete one full mock in your test area and review only the faults that repeat.",
    ],
  };

  const model = buildReportViewModel({
    readinessScore: sampleCore.readinessScore,
    readinessLabel: sampleCore.readinessLabel,
    summary: sampleCore.summary,
    nextSteps: sampleCore.nextSteps,
    riskAreasRaw: sortGroupedRiskAreasByImpact(sampleRiskAreas),
    weakAreasRaw: sampleHoursInput.weakAreas,
    lessonsTaken: sampleHoursInput.lessonsTaken,
    mockTestTaken: sampleHoursInput.mockTestTaken === "yes",
    mockTestResult: sampleHoursInput.mockTestResult,
    seriousFaults: sampleHoursInput.seriousFaults,
    drivingFaults: sampleHoursInput.drivingFaults,
    confidenceLevel: sampleHoursInput.confidenceLevel,
  });

  const recommendedHours = buildRecommendedHoursNarrative(model.estimatedHours, 42);

  return (
    <Section
      className="bg-brand-50 print:bg-white"
      contentClassName="max-w-3xl"
      eyebrow="Preview"
      title="Sample Premium Test Ready Score Report"
      subtitle="Illustrative example. Your paid report uses the same layout: readiness snapshot, debrief, roadmap, test risks, priorities, and lesson-hour estimate."
    >
      <div className="space-y-8 print:space-y-4">
        <PremiumReportSections model={model} recommendedHoursNarrative={recommendedHours} />

        <SampleLifetimeJourneyPreview />

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm text-amber-950">
          <p className="font-semibold">Example disclaimer</p>
          <p className="mt-2">
            This sample is illustrative only. Pass Pilot is independent and not affiliated with DVSA. It is created by a
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
            {BRAND_CTA.getMyScore}
          </Button>
          <Button href="/" variant="secondary" className="w-full min-h-[48px] sm:w-auto">
            Back to home
          </Button>
        </div>
        <p className="text-xs text-brand-500/90">
          Premium Test Ready Score Report · {PRICING.subscription.display}/month until you pass or cancel · Secure checkout via Stripe
        </p>
      </div>
    </Section>
  );
}
