"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { requestEntitlementLookup } from "@/lib/api/entitlement-lookup";
import { requestProgress } from "@/lib/api/progress";
import { requestAssessmentScore } from "@/lib/api/score-assessment";
import { Button } from "@/components/Button";
import { ProgressTrackingSection } from "@/components/ProgressTrackingSection";
import { EstimatedLessonHoursBlock } from "@/components/EstimatedLessonHoursBlock";
import { ReportSummaryDebrief } from "@/components/ReportSummaryDebrief";
import { RiskAreasSection } from "@/components/RiskAreasSection";
import { Section } from "@/components/Section";
import { SITE, WEAK_AREA_OPTIONS } from "@/lib/constants";
import { ApiRequestError } from "@/lib/errors";
import { formatIsoDateUk } from "@/lib/formatting";
import { reportCopySalt } from "@/lib/deterministic-report-copy";
import { buildRecommendedHoursNarrative, computeEstimatedLessonHours } from "@/lib/estimated-lesson-hours";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { loadPersistedRecord, saveScoredAssessment } from "@/lib/storage";
import type { MockReadinessResult } from "@/lib/types";
import type {
  AssessmentPayload,
  PersistedAssessmentRecordV2,
  ProgressSuccess,
  StoredAssessmentV1,
} from "@/lib/validation";

const reportCard =
  "rounded-2xl border border-brand-200/80 bg-white p-5 shadow-card ring-1 ring-black/[0.02] sm:p-8 sm:ring-0 print:border-brand-200 print:shadow-none";
const sectionTitle = "text-base font-semibold tracking-tight text-brand-950 sm:text-lg";
const sectionIntro = "mt-2 max-w-prose text-sm leading-relaxed text-brand-600";

function labelBadgeClass(label: MockReadinessResult["readinessLabel"]) {
  if (label === "Needs More Time") return "bg-red-50 text-red-900 ring-red-200";
  if (label === "Building Consistency") return "bg-amber-50 text-amber-950 ring-amber-200";
  if (label === "Nearly Test Ready") return "bg-sky-50 text-sky-950 ring-sky-200";
  return "bg-teal-50 text-teal-950 ring-teal-200";
}

function weakAreaLabels(ids: AssessmentPayload["weakAreas"]) {
  if (ids.length === 0) return "None selected";
  return ids
    .map((id) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id)
    .join(", ");
}

type ReadyPayload = {
  submittedAt: string;
  assessment: AssessmentPayload;
  result: MockReadinessResult;
};

type ViewState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; data: ReadyPayload }
  | { status: "migration_error"; message: string; legacy: StoredAssessmentV1 };

type ProgressUiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; data: ProgressSuccess }
  | { kind: "off" };

export function ResultsView() {
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const [progressUi, setProgressUi] = useState<ProgressUiState>({ kind: "idle" });

  const upgradeLegacyRecord = useCallback(async (legacy: StoredAssessmentV1) => {
    setState({ status: "loading" });
    try {
      const scored = await requestAssessmentScore(legacy.data);
      const v2: PersistedAssessmentRecordV2 = {
        version: 2,
        submittedAt: legacy.submittedAt,
        assessment: scored.assessment,
        result: scored.result,
      };
      saveScoredAssessment(v2);
      setState({
        status: "ready",
        data: {
          submittedAt: v2.submittedAt,
          assessment: v2.assessment,
          result: v2.result,
        },
      });
    } catch (e) {
      const message =
        e instanceof ApiRequestError
          ? e.message
          : "Could not refresh your score from the server. Retry or retake the assessment.";
      setState({ status: "migration_error", message, legacy });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const record = loadPersistedRecord();
      if (!record) {
        if (!cancelled) setState({ status: "empty" });
        return;
      }

      if (record.version === 2) {
        if (!cancelled) {
          setState({
            status: "ready",
            data: {
              submittedAt: record.submittedAt,
              assessment: record.assessment,
              result: record.result,
            },
          });
        }
        return;
      }

      await upgradeLegacyRecord(record);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [upgradeLegacyRecord]);

  useEffect(() => {
    if (state.status !== "ready") {
      setProgressUi({ kind: "idle" });
      return;
    }
    const email = state.data.assessment.email;
    let cancelled = false;
    setProgressUi({ kind: "loading" });

    requestProgress(email)
      .then((data) => {
        if (cancelled) return;
        setProgressUi({ kind: "ready", data });
      })
      .catch(async () => {
        if (cancelled) return;
        try {
          const fallback = await requestEntitlementLookup(email);
          if (cancelled) return;
          const synthetic: ProgressSuccess = {
            success: true,
            hasLifetimeAccess: fallback.hasLifetimeAccess,
            reportCount: fallback.reportCount,
            entries: [],
          };
          setProgressUi({ kind: "ready", data: synthetic });
        } catch {
          if (!cancelled) {
            setProgressUi({ kind: "off" });
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const snapshotRows = useMemo(() => {
    if (state.status !== "ready") return [];
    const a = state.data.assessment;
    return [
      { k: "Name", v: a.fullName },
      { k: "Email", v: a.email },
      { k: "Lessons taken", v: String(a.lessonsTaken) },
      {
        k: "Test booked",
        v: a.testBooked === "yes" ? `Yes · ${formatIsoDateUk(a.testDate)}` : "No",
      },
      {
        k: "Mock test",
        v:
          a.mockTestTaken === "yes"
            ? `Yes · ${a.mockTestResult === "pass" ? "Pass" : a.mockTestResult === "fail" ? "Fail" : "Not recorded"}`
            : "No",
      },
      { k: "Serious / driving faults", v: `${a.seriousFaults} / ${a.drivingFaults}` },
      { k: "Confidence (self-rated)", v: `${a.confidenceLevel}/10` },
      { k: "Weak areas", v: weakAreaLabels(a.weakAreas) },
      { k: "Extra notes", v: a.extraNotes?.trim() ? a.extraNotes : "None" },
    ];
  }, [state]);

  if (state.status === "loading") {
    return (
      <Section
        className="max-md:bg-transparent bg-brand-50"
        contentClassName="max-w-3xl"
        eyebrow="Prep2Pass"
        title="Loading your report"
      >
        <div className="animate-pulse space-y-4 rounded-2xl border border-brand-200/80 bg-white p-8 shadow-card ring-1 ring-black/[0.02]">
          <div className="h-8 w-48 rounded bg-brand-100" />
          <div className="h-32 w-full rounded-xl bg-brand-50" />
          <div className="h-40 w-full rounded-xl bg-brand-50" />
        </div>
      </Section>
    );
  }

  if (state.status === "empty") {
    return (
      <Section
        className="max-md:bg-transparent bg-brand-50"
        contentClassName="max-w-xl text-center"
        eyebrow="Prep2Pass"
        title="No report saved on this device yet"
        subtitle="Complete the TestReady Score assessment once. Your report appears here after checkout, and a copy stays in this browser until you clear site data."
      >
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            href="/assessment"
            variant="conversion"
            className="w-full sm:w-auto sm:min-w-[12rem]"
          >
            Start assessment
          </Button>
          <Button href="/" variant="ghost" className="w-full min-h-[48px] sm:w-auto">
            Back to home
          </Button>
        </div>
      </Section>
    );
  }

  if (state.status === "migration_error") {
    return (
      <Section
        className="max-md:bg-transparent bg-brand-50"
        contentClassName="max-w-xl"
        eyebrow="Prep2Pass"
        title="We could not refresh your saved report"
        subtitle={state.message}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="conversion"
            className="w-full sm:w-auto sm:min-w-[10rem]"
            onClick={() => {
              void upgradeLegacyRecord(state.legacy);
            }}
          >
            Try again
          </Button>
          <Button href="/assessment" variant="secondary" className="w-full min-h-[48px] sm:w-auto">
            Retake assessment
          </Button>
        </div>
      </Section>
    );
  }

  const { result: report, assessment } = state.data;
  const riskGroups = normalizeGroupedRiskAreas(report.riskAreas as unknown);
  const estimatedHours =
    report.estimatedLessonHours ?? computeEstimatedLessonHours(assessment, report.readinessScore);
  const lessonHoursNarrative = buildRecommendedHoursNarrative(estimatedHours, reportCopySalt(assessment));

  return (
    <Section
      className="max-md:bg-transparent bg-brand-50 print:bg-white print:py-10"
      contentClassName="max-w-3xl"
      eyebrow="Prep2Pass"
      subtitle="Test prep guidance based on your answers, guided by an ADI. Use it with your instructor."
    >
      <div className="space-y-5 pb-32 sm:space-y-10 sm:pb-0 print:space-y-6 md:pb-0">
        {/* A: score summary */}
        <div className={`${reportCard} print:break-inside-avoid`}>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-brand-500/90 sm:text-left">
            Your TestReady Score
          </p>

          <div className="mt-8 flex flex-col items-center gap-6 sm:mt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="text-center sm:text-left">
              <p
                className="text-6xl font-semibold tracking-tight text-brand-950 tabular-nums sm:text-7xl"
                aria-label={`Readiness score ${report.readinessScore} out of 100`}
              >
                {report.readinessScore}
              </p>
              <p className="mt-1 text-sm text-brand-500/85">out of 100</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ring-2 ring-inset ${labelBadgeClass(
                report.readinessLabel,
              )}`}
            >
              {report.readinessLabel}
            </span>
          </div>

          <ReportSummaryDebrief>
            <p>{report.summary}</p>
          </ReportSummaryDebrief>

          {progressUi.kind === "idle" ? null : progressUi.kind === "loading" ? (
            <ProgressTrackingSection status="loading" />
          ) : progressUi.kind === "off" ? null : (
            <ProgressTrackingSection
              status="ready"
              hasLifetimeAccess={progressUi.data.hasLifetimeAccess}
              entries={progressUi.data.entries}
              currentScore={report.readinessScore}
            />
          )}

          <div className="mt-10 border-t border-brand-100 pt-8 print:break-inside-avoid">
            <h3 className={sectionTitle}>Coach note</h3>
            <p className={sectionIntro}>
              A concise takeaway before your next lesson, grounded in your answers and written to support what your instructor sees on the road.
            </p>
            <div className="mt-4 rounded-xl border border-teal-200/80 bg-teal-50/85 px-5 py-5 text-sm leading-relaxed text-teal-950 shadow-sm ring-1 ring-teal-200/50 print:border-teal-200 print:bg-teal-50/60 print:ring-0">
              {report.coachMessage}
            </div>
          </div>

        </div>

        {/* B: risk areas */}
        <div className="print:break-inside-avoid">
          <RiskAreasSection blocks={riskGroups} />
        </div>

        {/* C: next steps */}
        <div className={`${reportCard} print:break-inside-avoid`}>
          <h2 className={sectionTitle}>What to do next</h2>
          <p className={sectionIntro}>
            A focused lesson plan from your report. Work through it in order with your instructor where you can.
          </p>
          <ol className="mt-6 space-y-3">
            {report.nextSteps.map((item, i) => (
              <li
                key={`next-step-${i}`}
                className="flex gap-4 rounded-xl border border-brand-100/90 bg-brand-50/50 px-4 py-3.5 text-sm leading-relaxed text-brand-800 print:border-brand-200 print:bg-white"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-800 ring-1 ring-brand-200/80 print:bg-brand-50"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* D: lesson guidance */}
        <div className={`${reportCard} print:break-inside-avoid`}>
          <h2 className={sectionTitle}>Lesson guidance</h2>
          <p className={sectionIntro}>
            The headline range and the note below use the same calculation, so the hours always match. Use both to plan
            with your instructor, not as a fixed rule.
          </p>
          <div className="mt-5">
            <EstimatedLessonHoursBlock hours={estimatedHours} />
          </div>
          <p className="mt-2 text-xs font-medium text-brand-600">How to use that time</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-brand-900">{lessonHoursNarrative}</p>
        </div>

        {/* E: use this report well */}
        <div className={`${reportCard} print:break-inside-avoid`}>
          <h2 className={sectionTitle}>Use this report well</h2>
          <p className={sectionIntro}>
            Structured insight only helps if you turn it into one or two concrete habits on the road.
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-brand-800">
            <li className="flex gap-3 rounded-xl border border-brand-100/80 bg-brand-50/40 px-4 py-3 print:bg-white">
              <span className="font-semibold text-brand-700" aria-hidden>
                ·
              </span>
              <span>Bring this to your instructor and agree one primary theme for your next lesson.</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-brand-100/80 bg-brand-50/40 px-4 py-3 print:bg-white">
              <span className="font-semibold text-brand-700" aria-hidden>
                ·
              </span>
              <span>Pick one or two risk areas to improve this week, and avoid spreading attention too thin.</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-brand-100/80 bg-brand-50/40 px-4 py-3 print:bg-white">
              <span className="font-semibold text-brand-700" aria-hidden>
                ·
              </span>
              <span>Use the numbered steps above as a checklist and revisit them after a couple of sessions.</span>
            </li>
          </ul>
        </div>

        {/* Snapshot */}
        <div className={`${reportCard} print:break-inside-avoid`}>
          <h2 className={sectionTitle}>Your assessment snapshot</h2>
          <p className={sectionIntro}>The answers you gave when you completed this assessment.</p>
          <dl className="mt-6 space-y-4">
            {snapshotRows.map((row) => (
              <div key={row.k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">{row.k}</dt>
                <dd className="mt-1 text-sm text-brand-900">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-5 text-sm leading-relaxed text-amber-950 print:border-brand-200 print:bg-white">
          <p className="font-semibold text-amber-950">Disclaimer</p>
          <p className="mt-2 text-amber-950/95">
            This TestReady Score report is guidance only. It is not driving instruction, not official DVSA advice, and
            not a guarantee of test outcomes. {SITE.name} is created by a DVSA-approved driving instructor and combines
            scoring with optional AI wording. Always review with your instructor alongside how you drive.
          </p>
        </div>

        <div className="rounded-2xl border border-brand-200/80 bg-white/95 p-5 text-sm leading-relaxed text-brand-700 shadow-card ring-1 ring-black/[0.02] print:hidden max-md:sticky max-md:bottom-0 max-md:z-20 max-md:-mx-0 max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0 max-md:px-4 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:pt-4 max-md:shadow-[0_-10px_36px_rgba(28,34,48,0.1)] max-md:backdrop-blur-lg sm:shadow-sm sm:ring-0">
          <p className="font-medium text-brand-900">What you might do from here</p>
          <p className="mt-2">
            Retake the assessment if your lessons shift materially, or use Find My Report if you checked out with an
            email and need this on another device.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/assessment" className="w-full sm:w-auto sm:min-w-[11rem]">
              Retake assessment
            </Button>
            <Button href="/report-lookup" variant="secondary" className="w-full min-h-[48px] sm:w-auto sm:min-w-[11rem]">
              Find another report
            </Button>
            <Button href="/" variant="ghost" className="w-full min-h-[48px] sm:w-auto">
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
