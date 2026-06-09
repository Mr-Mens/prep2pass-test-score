import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { DashboardTrajectory } from "@/components/dashboard/DashboardTrajectory";
import { EstimatedLessonHoursBlock } from "@/components/EstimatedLessonHoursBlock";
import { ScoreRingGauge } from "@/components/learner/ScoreRingGauge";
import { ReportSummaryDebrief } from "@/components/ReportSummaryDebrief";
import { RiskAreasSection } from "@/components/RiskAreasSection";
import { ReportSyllabusPanel } from "@/components/reports/ReportSyllabusPanel";
import { deriveDeltaVsPrior } from "@/lib/dashboard/journey-insights";
import {
  buildRecommendedHoursNarrative,
  computeEstimatedLessonHours,
  type EstimatedHoursInput,
  reportNarrativeSalt,
} from "@/lib/estimated-lesson-hours";
import { formatIsoDateUk } from "@/lib/formatting";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getLinkedPupilReportForInstructor } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { migrateWeakAreaIds } from "@/lib/weak-area-migration";
import type { AssessmentPayload } from "@/lib/validation";
import { syllabusProgressSnapshotSchema } from "@/lib/validation";

type Props = { params: { pupilId: string; reportId: string } };

const paramsSchema = z.object({
  pupilId: z.string().uuid(),
  reportId: z.string().uuid(),
});

function badgeClass(label: string) {
  if (label === "Needs More Time") return "bg-red-50 text-red-900 ring-red-200";
  if (label === "Building Consistency") return "bg-amber-50 text-amber-950 ring-amber-200";
  if (label === "Nearly Test Ready") return "bg-sky-50 text-sky-950 ring-sky-200";
  return "bg-teal-50 text-teal-950 ring-teal-200";
}

function syllabusFromRawMetadata(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const syllabus = "syllabus" in raw ? (raw as { syllabus: unknown }).syllabus : undefined;
  const p = syllabusProgressSnapshotSchema.safeParse(syllabus);
  return p.success ? p.data : null;
}

export default async function InstructorPupilReportPage({ params }: Props) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const user = await requireInstructorSession();
  if (!isSupabaseConfigured()) notFound();

  const bundle = await getLinkedPupilReportForInstructor(parsed.data.pupilId, parsed.data.reportId, user.id);
  if (!bundle) notFound();

  const { pupil, report } = bundle;
  const riskBlocks = normalizeGroupedRiskAreas(report.risk_areas as unknown);
  const weakAreas = migrateWeakAreaIds(report.weak_areas) as AssessmentPayload["weakAreas"];
  const hoursInput: EstimatedHoursInput = {
    lessonsTaken: report.lessons_taken,
    mockTestTaken: report.mock_test_taken ? "yes" : "no",
    mockTestResult: report.mock_test_result as AssessmentPayload["mockTestResult"],
    seriousFaults: report.serious_faults,
    drivingFaults: report.driving_faults,
    weakAreas,
    confidenceLevel: report.confidence_level,
  };
  const estimatedHours = computeEstimatedLessonHours(hoursInput, report.readiness_score);
  const recommendedHoursNarrative = buildRecommendedHoursNarrative(estimatedHours, reportNarrativeSalt(report.id));
  const syllabusSnapshot = syllabusFromRawMetadata(report.raw_metadata);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
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

      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
          <ScoreRingGauge score={report.readiness_score} size={176} slim className="shrink-0" />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Test Ready Score</p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${badgeClass(
                  report.readiness_label,
                )}`}
              >
                {report.readiness_label}
              </span>
            </div>
            <ReportSummaryDebrief className="mt-6">
              <p>{report.summary}</p>
            </ReportSummaryDebrief>
          </div>
        </div>
      </div>

      {syllabusSnapshot ? <ReportSyllabusPanel syllabus={syllabusSnapshot} /> : null}

      <div className="rounded-2xl border border-teal-200/80 bg-teal-50/80 p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-teal-950">Coach note</h2>
        <p className="mt-3 text-sm leading-relaxed text-teal-900">{report.coach_message}</p>
      </div>

      <RiskAreasSection blocks={riskBlocks} />

      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-brand-950">Action plan</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-brand-700">
          {(report.next_steps as string[]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <div className="mt-6">
          <EstimatedLessonHoursBlock hours={estimatedHours} />
        </div>
        <p className="mt-6 text-sm font-medium leading-relaxed text-brand-800">{recommendedHoursNarrative}</p>
      </div>
    </div>
  );
}
