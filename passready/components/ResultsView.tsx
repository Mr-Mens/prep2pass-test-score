"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { requestAssessmentScore } from "@/lib/api/score-assessment";
import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { SITE, WEAK_AREA_OPTIONS } from "@/lib/constants";
import { ApiRequestError } from "@/lib/errors";
import { formatIsoDateUk, formatSubmittedAt } from "@/lib/formatting";
import { normalizeGroupedRiskAreas } from "@/lib/risk-areas";
import { loadPersistedRecord, saveScoredAssessment } from "@/lib/storage";
import type { MockReadinessResult } from "@/lib/types";
import type { AssessmentPayload, GroupedRiskArea, PersistedAssessmentRecordV2, StoredAssessmentV1 } from "@/lib/validation";

function labelBadgeClass(label: MockReadinessResult["readinessLabel"]) {
  if (label === "Not Ready") return "bg-red-50 text-red-900 ring-red-200";
  if (label === "Nearly Ready") return "bg-amber-50 text-amber-950 ring-amber-200";
  return "bg-teal-50 text-teal-950 ring-teal-200";
}

function severityBadgeClass(severity: GroupedRiskArea["severity"]) {
  if (severity === "high") return "bg-red-50 text-red-900 ring-red-200";
  if (severity === "medium") return "bg-amber-50 text-amber-950 ring-amber-200";
  return "bg-brand-50 text-brand-800 ring-brand-200";
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

export function ResultsView() {
  const [state, setState] = useState<ViewState>({ status: "loading" });

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
          : "Could not refresh your score from the server. Retry or retake the TestReady Score Assessment.";
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
            ? `Yes · ${a.mockTestResult === "pass" ? "Pass" : a.mockTestResult === "fail" ? "Fail" : "—"}`
            : "No",
      },
      { k: "Serious / driving faults", v: `${a.seriousFaults} / ${a.drivingFaults}` },
      { k: "Confidence (self-rated)", v: `${a.confidenceLevel}/10` },
      { k: "Weak areas", v: weakAreaLabels(a.weakAreas) },
      { k: "Extra notes", v: a.extraNotes?.trim() ? a.extraNotes : "—" },
    ];
  }, [state]);

  if (state.status === "loading") {
    return (
      <Section className="bg-brand-50" contentClassName="max-w-3xl" eyebrow="Results" title="Loading your report">
        <div className="animate-pulse space-y-4 rounded-2xl border border-brand-100 bg-white p-8 shadow-card">
          <div className="h-8 w-40 rounded bg-brand-100" />
          <div className="h-24 w-full rounded-xl bg-brand-50" />
          <div className="h-40 w-full rounded-xl bg-brand-50" />
        </div>
      </Section>
    );
  }

  if (state.status === "empty") {
    return (
      <Section
        className="bg-brand-50"
        contentClassName="max-w-xl text-center"
        eyebrow="Results"
        title="No TestReady Score Assessment found yet"
        subtitle="Complete the TestReady Score Assessment once — your Premium TestReady Score Report appears here. Results are computed on our servers; this browser keeps a local copy until you clear site data."
      >
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button href="/assessment" className="w-full px-6 py-3 text-base sm:w-auto">
            Get My TestReady Score
          </Button>
          <Button href="/" variant="ghost" className="w-full sm:w-auto">
            Back to home
          </Button>
        </div>
      </Section>
    );
  }

  if (state.status === "migration_error") {
    return (
      <Section
        className="bg-brand-50"
        contentClassName="max-w-xl"
        eyebrow="Results"
        title="We could not refresh your saved score"
        subtitle={state.message}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              void upgradeLegacyRecord(state.legacy);
            }}
          >
            Try again
          </Button>
          <Button href="/assessment" variant="secondary" className="w-full sm:w-auto">
            Get My TestReady Score
          </Button>
        </div>
      </Section>
    );
  }

  const { submittedAt, result: report } = state.data;
  const sourceLabel =
    report.metadata.source === "ai" ? "AI-enriched Premium TestReady Score Report" : "Standard report";
  const riskGroups = normalizeGroupedRiskAreas(
    report.riskAreas as GroupedRiskArea[] | string[],
  );

  return (
    <Section
      className="bg-brand-50 print:bg-white"
      contentClassName="max-w-3xl"
      eyebrow="Your report"
      title="Premium TestReady Score Report"
      subtitle={`Submitted ${formatSubmittedAt(submittedAt)} on this device. Score computed on our servers; also cached locally on this device for quick access.`}
    >
      <div className="space-y-8 print:space-y-4">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card print:shadow-none sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-600">Readiness score</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <p className="text-5xl font-semibold tracking-tight text-brand-950">{report.readinessScore}</p>
                <p className="pb-1 text-sm text-brand-600">out of 100</p>
              </div>
            </div>
            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${labelBadgeClass(
                report.readinessLabel,
              )}`}
            >
              {report.readinessLabel}
            </span>
          </div>
          <p className="mt-2 text-xs text-brand-500">
            {sourceLabel}
            {report.metadata.model ? ` · ${report.metadata.model}` : ""}
          </p>
          <p className="mt-5 text-sm leading-relaxed text-brand-800">{report.summary}</p>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-6 shadow-card print:shadow-none sm:p-8">
          <h2 className="text-lg font-semibold text-teal-950">Instructor coach note</h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-900">{report.coachMessage}</p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card print:shadow-none sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">Recommended lesson focus</h2>
          <p className="mt-3 text-sm font-medium text-brand-800">{report.recommendedHours}</p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card print:shadow-none sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">
            Your Test Risk Areas (Based on Driving Skills Framework)
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-brand-500">
            Grouped using common practical test skill themes for clarity — not affiliated with DVSA.
          </p>
          <div className="mt-6 space-y-5">
            {riskGroups.map((block) => (
              <div
                key={block.group}
                className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 gap-y-1">
                  <h3 className="text-base font-semibold text-brand-950">{block.group}</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${severityBadgeClass(
                      block.severity,
                    )}`}
                  >
                    {block.severity} risk
                  </span>
                </div>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-brand-800">
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
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-brand-700">
            {report.nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card print:shadow-none sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">What to do next</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-brand-700">
            <li className="rounded-xl bg-brand-50/60 px-4 py-3">
              Share this report with your instructor and agree one primary focus for your next lesson.
            </li>
            <li className="rounded-xl bg-brand-50/60 px-4 py-3">
              Revisit your highest-risk area first, then re-check confidence after two focused sessions.
            </li>
            <li className="rounded-xl bg-brand-50/60 px-4 py-3">
              Use Find My Report if you purchased with email storage and need access from another device.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card print:shadow-none sm:p-8">
          <h2 className="text-lg font-semibold text-brand-950">Your answers (snapshot)</h2>
          <p className="mt-1 text-sm text-brand-600">
            This device caches your answers and latest score for convenience (local key{" "}
            <span className="font-mono text-xs">passready_assessment</span>, v2).
          </p>
          <dl className="mt-6 space-y-4">
            {snapshotRows.map((row) => (
              <div key={row.k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-500">{row.k}</dt>
                <dd className="mt-1 text-sm text-brand-900">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm leading-relaxed text-amber-950 print:border-brand-200 print:bg-white">
          <p className="font-semibold">Disclaimer</p>
          <p className="mt-2">
            This Premium TestReady Score Report is guidance only — not driving instruction, DVSA
            guidance, or a guarantee of test performance. {SITE.name} combines deterministic scoring
            with optional AI enrichment; review with your instructor before test decisions.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/assessment" className="w-full px-6 py-3 text-base sm:w-auto">
            Get My TestReady Score
          </Button>
          <Button href="/" variant="secondary" className="w-full sm:w-auto">
            Back to home
          </Button>
        </div>
      </div>
    </Section>
  );
}
