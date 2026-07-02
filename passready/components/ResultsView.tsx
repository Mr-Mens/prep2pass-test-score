"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { requestEntitlementLookup } from "@/lib/api/entitlement-lookup";
import { requestProgress } from "@/lib/api/progress";
import { requestAssessmentScore } from "@/lib/api/score-assessment";
import { Button } from "@/components/Button";
import { PremiumReportSections } from "@/components/reports/PremiumReportSections";
import { ProgressTrackingSection } from "@/components/ProgressTrackingSection";
import { Section } from "@/components/Section";
import { BRAND_CTA, LIFETIME_MEMBER_UI, PRICING, SITE, WEAK_AREA_OPTIONS } from "@/lib/constants";
import { ApiRequestError } from "@/lib/errors";
import { formatIsoDateUk } from "@/lib/formatting";
import { reportCopySalt } from "@/lib/deterministic-report-copy";
import { buildRecommendedHoursNarrative } from "@/lib/estimated-lesson-hours";
import { buildReportViewModelFromAssessment } from "@/lib/report-view-model";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const [progressUi, setProgressUi] = useState<ProgressUiState>({ kind: "idle" });
  const [upgradeNotice, setUpgradeNotice] = useState<"success" | "already" | null>(null);

  useEffect(() => {
    const flag = searchParams.get("upgrade");
    if (flag === "success" || flag === "already") {
      setUpgradeNotice(flag);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("upgrade");
      const qs = params.toString();
      router.replace(qs ? `/results?${qs}` : "/results");
    }
  }, [router, searchParams]);

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
    let cancelled = false;
    setProgressUi({ kind: "loading" });

    requestProgress()
      .then((data) => {
        if (cancelled) return;
        setProgressUi({ kind: "ready", data });
      })
      .catch(async () => {
        if (cancelled) return;
        try {
          const fallback = await requestEntitlementLookup();
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
      {
        k: "Serious / driving faults",
        v:
          a.mockTestTaken === "yes" || a.seriousFaults > 0 || a.drivingFaults > 0
            ? `${a.seriousFaults} / ${a.drivingFaults}`
            : "Not recorded (no mock yet)",
      },
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
        eyebrow="Pass Pilot"
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
        eyebrow="Pass Pilot"
        title="No report saved on this device yet"
        subtitle="Complete the Test Ready Score once. Your report appears here after checkout, and a copy stays in this browser until you clear site data."
      >
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            href="/assessment"
            variant="conversion"
            className="w-full sm:w-auto sm:min-w-[12rem]"
          >
            {BRAND_CTA.getMyScore}
          </Button>
          <Button href="/dashboard" variant="ghost" className="w-full min-h-[48px] sm:w-auto">
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
        eyebrow="Pass Pilot"
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
            {BRAND_CTA.getUpdatedScore}
          </Button>
        </div>
      </Section>
    );
  }

  const { result: report, assessment } = state.data;
  const model = buildReportViewModelFromAssessment(assessment, report);
  const lessonHoursNarrative = buildRecommendedHoursNarrative(model.estimatedHours, reportCopySalt(assessment));
  const resultsLifetimeMemberUi = progressUi.kind === "ready" && progressUi.data.hasLifetimeAccess;

  return (
    <Section
      className="max-md:bg-transparent bg-brand-50 print:bg-white print:py-10"
      contentClassName="max-w-3xl"
      eyebrow="Pass Pilot"
      subtitle="Test prep guidance based on your answers, guided by an ADI. Use it with your instructor."
    >
      <div className="space-y-5 pb-32 sm:space-y-10 sm:pb-0 print:space-y-6 md:pb-0">
        {upgradeNotice ? (
          <div
            role="status"
            className="rounded-2xl border border-teal-300/80 bg-gradient-to-br from-teal-50 to-white px-5 py-4 shadow-card ring-1 ring-teal-600/10 print:hidden"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              {upgradeNotice === "success" ? "Lifetime access activated" : "Lifetime already active"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-brand-900">
              {upgradeNotice === "success"
                ? "Thanks for the upgrade. You can now generate unlimited reports and your progress will appear below."
                : "This email already has lifetime access. Retake the assessment any time to add a new report to your timeline."}
            </p>
          </div>
        ) : null}

        <PremiumReportSections
          model={model}
          recommendedHoursNarrative={lessonHoursNarrative}
          showDisclaimer={false}
          journeySection={
            <>
              {progressUi.kind === "loading" ? <ProgressTrackingSection status="loading" /> : null}
              {progressUi.kind === "ready" ? (
                <>
                  <ProgressTrackingSection
                    status="ready"
                    hasLifetimeAccess={progressUi.data.hasLifetimeAccess}
                    entries={progressUi.data.entries}
                    currentScore={report.readinessScore}
                  />
                  {progressUi.data.hasLifetimeAccess ? (
                    <div className={`${reportCard} print:hidden`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-500">
                        {LIFETIME_MEMBER_UI.journeyInsights}
                      </p>
                      <h3 className="mt-2 text-base font-semibold tracking-tight text-brand-950 sm:text-lg">
                        {LIFETIME_MEMBER_UI.reportsHistory}
                      </h3>
                      <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-600">
                        The arc on your dashboard shows how checkpoints cluster over time. Open saved write-ups anytime
                        from My reports.
                      </p>
                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Link
                          href="/progress"
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
                        >
                          {LIFETIME_MEMBER_UI.journey}
                        </Link>
                        <Link
                          href="/my-reports"
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
                        >
                          All saved reports
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </>
          }
        />

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
              <span>Use your action plan for this week&apos;s focus. Your learning roadmap has the full syllabus checklist.</span>
            </li>
          </ul>
        </div>

        {progressUi.kind === "ready" && !progressUi.data.hasLifetimeAccess ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-teal-300/80 bg-gradient-to-br from-teal-50 via-white to-brand-50/60 p-5 shadow-card ring-1 ring-teal-600/[0.07] sm:p-7 print:hidden">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,rgba(20,184,166,0.08))]" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                  Lifetime access
                </p>
                <p className="mt-2 text-base font-semibold tracking-tight text-brand-950 sm:text-lg">
                  Keep tracking progress, unlock unlimited reports
                </p>
                <p className="mt-2 text-sm leading-relaxed text-brand-700">
                  One payment for unlimited Premium TestReady reports and a private timeline of every score saved
                  under your email. No subscription.
                </p>
              </div>
              <Button
                href="/upgrade"
                variant="conversion"
                className="w-full min-h-[52px] sm:w-auto sm:min-w-[16rem]"
              >
                Upgrade to lifetime ({PRICING.lifetime.display})
              </Button>
            </div>
          </div>
        ) : null}

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
            scoring with Pass Pilot Smart intelligence. Always review with your instructor alongside how you drive.
          </p>
        </div>

        <div className="rounded-2xl border border-brand-200/80 bg-white/95 p-5 text-sm leading-relaxed text-brand-700 shadow-card ring-1 ring-black/[0.02] print:hidden max-md:sticky max-md:bottom-0 max-md:z-20 max-md:-mx-0 max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0 max-md:px-4 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:pt-4 max-md:shadow-[0_-10px_36px_rgba(28,34,48,0.1)] max-md:backdrop-blur-lg sm:shadow-sm sm:ring-0">
          <p className="font-medium text-brand-900">What you might do from here</p>
          <p className="mt-2">
            {resultsLifetimeMemberUi
              ? "When lessons or test timing move, generate a fresh checkpoint. Your Pass Pilot account keeps the full timeline under the same lifetime access, with no checkout between runs."
              : "Get an updated Test Ready Score if your lessons shift materially, or use Find My Report if you checked out with an email and need this on another device."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/assessment" className="w-full sm:w-auto sm:min-w-[11rem]">
              {BRAND_CTA.updateMyScore}
            </Button>
            <Button href="/report-lookup" variant="secondary" className="w-full min-h-[48px] sm:w-auto sm:min-w-[11rem]">
              Find another report
            </Button>
            <Button href="/dashboard" variant="ghost" className="w-full min-h-[48px] sm:w-auto">
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
