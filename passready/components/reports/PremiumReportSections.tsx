import { EstimatedLessonHoursBlock } from "@/components/EstimatedLessonHoursBlock";
import { ReportSummaryDebrief } from "@/components/ReportSummaryDebrief";
import { RiskAreasSection } from "@/components/RiskAreasSection";
import { LearnerIdentifiedAreasSection } from "@/components/reports/LearnerIdentifiedAreasSection";
import { ReportDisclaimerFooter } from "@/components/reports/ReportDisclaimerFooter";
import { ReportReadinessSnapshot } from "@/components/reports/ReportReadinessSnapshot";
import { ReportSyllabusPanel } from "@/components/reports/ReportSyllabusPanel";
import { TestPassRisksSection } from "@/components/reports/TestPassRisksSection";
import { TopPrioritiesSection } from "@/components/reports/TopPrioritiesSection";
import { buildRecommendedHoursNarrative } from "@/lib/estimated-lesson-hours";
import type { ReportViewModel } from "@/lib/report-view-model";

type Props = {
  model: ReportViewModel;
  recommendedHoursNarrative?: string;
  narrativeSalt?: number;
  showDetailedRisks?: boolean;
  showDisclaimer?: boolean;
  journeySection?: React.ReactNode;
};

export function PremiumReportSections({
  model,
  recommendedHoursNarrative,
  narrativeSalt = 0,
  showDetailedRisks = true,
  showDisclaimer = true,
  journeySection,
}: Props) {
  const hoursNarrative =
    recommendedHoursNarrative ??
    buildRecommendedHoursNarrative(model.estimatedHours, narrativeSalt);

  return (
    <>
      <ReportReadinessSnapshot
        score={model.readinessScore}
        label={model.readinessLabel}
        bandDisplay={model.readinessBandDisplay}
        confidenceLevel={model.confidenceLevel}
        confidenceDisplay={model.confidenceDisplay}
        summary={
          <ReportSummaryDebrief className="mt-0">
            <p>{model.summary}</p>
          </ReportSummaryDebrief>
        }
      />

      {model.syllabus ? <ReportSyllabusPanel syllabus={model.syllabus} /> : null}

      <LearnerIdentifiedAreasSection details={model.weakAreaDetails} />

      <TestPassRisksSection risks={model.testPassRisks} mockTestTaken={model.mockTestTaken} />

      <TopPrioritiesSection priorities={model.topPriorities} />

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">
          Estimated hours to test readiness
        </p>
        <div className="mt-4">
          <EstimatedLessonHoursBlock hours={model.estimatedHours} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-brand-700">{hoursNarrative}</p>
      </section>

      {showDetailedRisks ? (
        <details className="group rounded-2xl border border-brand-100 bg-white shadow-sm open:shadow-sm">
          <summary className="cursor-pointer list-none p-6 sm:p-8 [&::-webkit-details-marker]:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Detailed breakdown</p>
            <h2 className="mt-2 text-lg font-semibold text-brand-950">Skill area breakdown</h2>
            <p className="mt-2 text-sm text-brand-600 group-open:hidden">Tap to see grouped risk areas and skill detail.</p>
          </summary>
          <div className="border-t border-brand-100 px-2 pb-2 pt-0 sm:px-4 sm:pb-4">
            <RiskAreasSection blocks={model.riskAreas} compact />
          </div>
        </details>
      ) : null}

      {journeySection}

      {showDisclaimer ? <ReportDisclaimerFooter /> : null}
    </>
  );
}
