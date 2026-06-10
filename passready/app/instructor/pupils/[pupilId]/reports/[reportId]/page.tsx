import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PremiumReportSections } from "@/components/reports/PremiumReportSections";
import { buildRecommendedHoursNarrative, reportNarrativeSalt } from "@/lib/estimated-lesson-hours";
import { formatIsoDateUk } from "@/lib/formatting";
import { buildReportViewModel, type ReportViewModel } from "@/lib/report-view-model";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getLinkedPupilReportForInstructor } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import type { AssessmentPayload } from "@/lib/validation";

type Props = { params: { pupilId: string; reportId: string } };

const paramsSchema = z.object({
  pupilId: z.string().uuid(),
  reportId: z.string().uuid(),
});

export default async function InstructorPupilReportPage({ params }: Props) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const user = await requireInstructorSession();
  if (!isSupabaseConfigured()) notFound();

  const bundle = await getLinkedPupilReportForInstructor(parsed.data.pupilId, parsed.data.reportId, user.id);
  if (!bundle) notFound();

  const { pupil, report } = bundle;
  const model = buildReportViewModel({
    readinessScore: report.readiness_score,
    readinessLabel: report.readiness_label as ReportViewModel["readinessLabel"],
    summary: report.summary,
    nextSteps: report.next_steps as string[],
    riskAreasRaw: report.risk_areas,
    weakAreasRaw: report.weak_areas,
    lessonsTaken: report.lessons_taken,
    mockTestTaken: report.mock_test_taken,
    mockTestResult: report.mock_test_result as AssessmentPayload["mockTestResult"],
    seriousFaults: report.serious_faults,
    drivingFaults: report.driving_faults,
    confidenceLevel: report.confidence_level,
    testBooked: report.test_booked ? "yes" : "no",
    testDate: report.test_date,
    rawMetadata: report.raw_metadata,
    weakAreaDetailsRaw: report.weak_area_details,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div>
        <Link
          href={`/instructor/pupils/${pupil.id}`}
          className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          ← Back to {pupil.pupil_name}
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-950 sm:text-3xl">Premium report</h1>
        <p className="mt-2 text-sm text-brand-600">
          {pupil.pupil_name} · {formatIsoDateUk(report.created_at)}
        </p>
      </div>

      <PremiumReportSections
        model={model}
        recommendedHoursNarrative={buildRecommendedHoursNarrative(model.estimatedHours, reportNarrativeSalt(report.id))}
      />
    </div>
  );
}
