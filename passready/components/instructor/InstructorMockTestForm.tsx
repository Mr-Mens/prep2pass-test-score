"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { mergeMockTestPayload, buildDefaultMockTestForm } from "@/lib/instructor/mock-test-defaults";
import {
  ALL_FAULT_SECTIONS,
  FAULT_GRID_COLUMNS,
  type FaultSectionDef,
  type FaultSectionKey,
} from "@/lib/instructor/mock-test-rows";
import { useCabFullscreen } from "@/lib/instructor/use-cab-fullscreen";
import { WEATHER_SHEET_OPTIONS } from "@/lib/instructor/mock-test-weather";
import {
  aggregateFaultCounts,
  buildMockTestSummary,
  computeMockOutcome,
  MINOR_TALLY_CAP,
} from "@/lib/instructor/mock-test-scoring";
import type { MockTestFormPayload } from "@/lib/instructor/mock-test-schemas";
import type { FaultMarks } from "@/lib/instructor/types";

import { MockTestFaultControls } from "./MockTestFaultControls";
import { MockTestLiveStatsBar } from "./MockTestLiveStatsBar";

type PupilRow = {
  id: string;
  pupil_name: string;
  pupil_email: string;
};

type Props = {
  initialMockTestId?: string;
  autoStartCab?: boolean;
};

function patchFaultRow(
  payload: MockTestFormPayload,
  sectionKey: FaultSectionKey,
  rowId: string,
  next: FaultMarks,
): MockTestFormPayload {
  const cur = payload[sectionKey] as Record<string, FaultMarks>;
  return {
    ...payload,
    [sectionKey]: {
      ...cur,
      [rowId]: next,
    },
  };
}

export function InstructorMockTestForm({ initialMockTestId, autoStartCab = false }: Props) {
  const router = useRouter();
  const cab = useCabFullscreen();
  const [form, setForm] = useState<MockTestFormPayload>(() => buildDefaultMockTestForm());
  const [pupils, setPupils] = useState<PupilRow[]>([]);
  const [pupilId, setPupilId] = useState<string | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [minorThreshold, setMinorThreshold] = useState(15);
  const [testId, setTestId] = useState<string | null>(initialMockTestId ?? null);
  const [loading, setLoading] = useState(Boolean(initialMockTestId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPupils = useCallback(async () => {
    try {
      const res = await fetch("/api/instructor/pupils", { credentials: "include" });
      const json = (await res.json()) as { success?: boolean; pupils?: PupilRow[] };
      if (json.success && Array.isArray(json.pupils)) setPupils(json.pupils);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadPupils();
  }, [loadPupils]);

  useEffect(() => {
    if (!initialMockTestId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/instructor/mock-tests/${initialMockTestId}`, { credentials: "include" });
        const json = (await res.json()) as {
          success?: boolean;
          mockTest?: {
            id: string;
            pupil_id: string | null;
            pupil_name_snapshot: string | null;
            pupil_email_snapshot: string | null;
            minor_fault_threshold: number;
            form_payload: unknown;
          };
        };
        if (!res.ok || !json.success || !json.mockTest) {
          setError("Could not load this mock test.");
          return;
        }
        const row = json.mockTest;
        setTestId(row.id);
        setForm(mergeMockTestPayload(row.form_payload));
        setMinorThreshold(row.minor_fault_threshold);
        if (row.pupil_id) setPupilId(row.pupil_id);
        setManualName(row.pupil_name_snapshot?.trim() ?? "");
        setManualEmail(row.pupil_email_snapshot?.trim() ?? "");
      } catch {
        setError("Could not load this mock test.");
      } finally {
        setLoading(false);
      }
    })();
  }, [initialMockTestId]);

  useEffect(() => {
    if (!autoStartCab || loading) return;
    void cab.open();
  }, [autoStartCab, loading, cab.open]);

  const live = useMemo(() => {
    const counts = aggregateFaultCounts(form);
    const { outcome, failReason } = computeMockOutcome(form, minorThreshold);
    const summary = buildMockTestSummary(form, minorThreshold);
    return { counts, outcome, failReason, summary };
  }, [form, minorThreshold]);

  const pupilNameSnapshot = pupilId
    ? pupils.find((p) => p.id === pupilId)?.pupil_name ?? manualName
    : manualName;
  const pupilEmailSnapshot = pupilId
    ? pupils.find((p) => p.id === pupilId)?.pupil_email ?? manualEmail
    : manualEmail;

  async function save(status: "draft" | "completed") {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/instructor/mock-tests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testId ?? undefined,
          pupilId,
          pupilNameSnapshot: pupilNameSnapshot.trim(),
          pupilEmailSnapshot: pupilEmailSnapshot.trim(),
          payload: form,
          status,
          minorFaultThreshold: minorThreshold,
        }),
      });
      const json = (await res.json()) as { success?: boolean; mockTest?: { id: string } };
      if (!res.ok || !json.success || !json.mockTest?.id) {
        setError("Save failed. Check your connection and try again.");
        return;
      }
      setTestId(json.mockTest.id);
      if (status === "completed") {
        router.push(`/instructor/mock-tests/${json.mockTest.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Save failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function onSelectPupil(id: string) {
    if (!id) {
      setPupilId(null);
      return;
    }
    setPupilId(id);
    const row = pupils.find((p) => p.id === id);
    if (row) {
      setManualName(row.pupil_name);
      setManualEmail(row.pupil_email);
    }
  }

  function renderFaultCard(sec: FaultSectionDef, opts?: { showSectionTitle?: boolean }) {
    const showTitle = opts?.showSectionTitle !== false;
    return (
      <div key={sec.key} className="min-w-0">
        <div className="rounded-lg border border-brand-200/90 bg-white px-2 py-1.5 shadow-sm">
          {showTitle ? (
            <>
              <h3 className="mock-sheet-card-title">{sec.title}</h3>
              {sec.hint ? <p className="mock-sheet-hint mt-1">{sec.hint}</p> : null}
            </>
          ) : null}
          <div className={showTitle ? "mt-1.5" : ""}>
            {sec.rows.map((row, idx) => (
              <div
                key={row.id}
                className={`grid items-center gap-x-2 gap-y-1 border-b border-brand-100/90 py-1.5 sm:grid-cols-[minmax(0,1fr)_auto] ${
                  idx === sec.rows.length - 1 ? "border-b-0" : ""
                }`}
              >
                <p className="mock-sheet-row-label">{row.label}</p>
                <div className="justify-self-start sm:justify-self-end">
                  <MockTestFaultControls
                    compact
                    value={
                      (form[sec.key] as Record<string, FaultMarks>)[row.id] ?? {
                        minorCount: 0,
                        serious: false,
                        dangerous: false,
                      }
                    }
                    onChange={(next) => setForm((f) => patchFaultRow(f, sec.key, row.id, next))}
                    disabled={saving}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-sm">
        <p className="mock-sheet-body font-medium">Loading mock test…</p>
      </div>
    );
  }

  const [col1, col2, col3] = FAULT_GRID_COLUMNS;

  return (
    <div
      ref={cab.containerRef}
      className={`mock-sheet min-w-0 max-w-full overflow-x-hidden ${
        cab.isOpen
          ? `flex h-dvh max-h-dvh flex-col bg-[#f0f2f5] ${
              cab.mode === "overlay"
                ? "fixed inset-0 z-[200] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
                : ""
            }`
          : "space-y-4 pb-16"
      }`}
    >
      <header
        className={`shrink-0 space-y-2 border-b border-brand-200/80 bg-[#f0f2f5]/98 px-1 pb-2 pt-1 backdrop-blur sm:px-0 ${
          cab.isOpen ? "" : "sticky top-0 z-20 md:rounded-2xl md:border md:border-brand-100 md:bg-white md:p-4 md:shadow-sm"
        }`}
      >
        {cab.isOpen ? (
          <div className="flex items-center justify-between gap-2 px-1 sm:px-0">
            <div className="min-w-0">
              <p className="mock-sheet-eyebrow">Mock test in progress</p>
              <p className="truncate font-heading text-base font-semibold text-brand-950">
                {pupilNameSnapshot.trim() || "Candidate"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save("draft")}
                className="min-h-[36px] rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save("completed")}
                className="min-h-[36px] rounded-md border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-900 hover:bg-brand-50 disabled:opacity-50"
              >
                Finish
              </button>
              <button
                type="button"
                aria-label="Exit fullscreen mock test"
                onClick={() => void cab.close()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-lg font-semibold text-brand-800 hover:bg-brand-50"
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mock-sheet-eyebrow">Pass Pilot · Instructor</p>
              <h1 className="mt-1 mock-sheet-hero-title">Mock test sheet</h1>
              <p className="mt-1 mock-sheet-hero-sub">DVSA-style mock test report · Not affiliated with DVSA</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void cab.open()}
                className="min-h-[40px] rounded-md bg-brand-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
              >
                Start mock test
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save("draft")}
                className="min-h-[40px] rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save("completed")}
                className="min-h-[40px] rounded-md border-2 border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50 disabled:opacity-50"
              >
                Save &amp; finish
              </button>
            </div>
          </div>
        )}

        <MockTestLiveStatsBar
          live={live}
          minorThreshold={minorThreshold}
          onMinorThresholdChange={setMinorThreshold}
          compact={cab.isOpen}
        />

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-sm text-red-900" role="alert">
            {error}
          </p>
        ) : null}
      </header>

      <div
        className={
          cab.isOpen
            ? "min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-y-contain px-1 py-3 sm:px-0"
            : "space-y-4"
        }
      >
      {/* Top band, candidate · test · declaration · vehicle (reference sheet order) */}
      {!cab.isOpen ? (
      <section className="rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 bg-brand-50/80 px-4 py-3">
          <h2 className="mock-sheet-h2">Candidate &amp; test</h2>
        </div>
        <div className="grid gap-4 p-3 md:grid-cols-3 md:gap-3">
          <div className="space-y-2 border-b border-brand-100 pb-3 md:border-b-0 md:pb-0">
            <p className="mock-sheet-eyebrow">Candidate details</p>
            <label className="mock-sheet-label">
              Name
              <input
                value={form.candidate.fullName}
                onChange={(e) => setForm({ ...form, candidate: { ...form.candidate, fullName: e.target.value } })}
                className="mock-sheet-control"
              />
            </label>
            <label className="mock-sheet-label">
              Address
              <input
                value={form.candidate.address}
                onChange={(e) => setForm({ ...form, candidate: { ...form.candidate, address: e.target.value } })}
                className="mock-sheet-control"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="mock-sheet-label">
                App ref
                <input
                  value={form.candidate.appRef}
                  onChange={(e) => setForm({ ...form, candidate: { ...form.candidate, appRef: e.target.value } })}
                  className="mock-sheet-control"
                />
              </label>
              <label className="mock-sheet-label">
                Driver no.
                <input
                  value={form.candidate.driverNo}
                  onChange={(e) => setForm({ ...form, candidate: { ...form.candidate, driverNo: e.target.value } })}
                  className="mock-sheet-control"
                />
              </label>
            </div>
            <label className="mock-sheet-check">
              <input
                type="checkbox"
                checked={form.candidate.instructorCar ?? false}
                onChange={(e) => setForm({ ...form, candidate: { ...form.candidate, instructorCar: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-brand-300 text-teal-600"
              />
              Instructor&apos;s car
            </label>
          </div>

          <div className="space-y-2 border-b border-brand-100 pb-3 md:border-b-0 md:pb-0">
            <p className="mock-sheet-eyebrow">Test details</p>
            <label className="mock-sheet-label">
              Test category
              <select
                value={form.test.category}
                onChange={(e) => setForm({ ...form, test: { ...form.test, category: e.target.value } })}
                className="mock-sheet-control"
              >
                <option>B – Car</option>
                <option>A – Motorcycle</option>
                <option>BE – Car &amp; trailer</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="mock-sheet-label">
                Date
                <input
                  type="date"
                  value={form.test.date}
                  onChange={(e) => setForm({ ...form, test: { ...form.test, date: e.target.value } })}
                  className="mock-sheet-control"
                />
              </label>
              <label className="mock-sheet-label">
                Time
                <input
                  type="time"
                  value={form.test.time}
                  onChange={(e) => setForm({ ...form, test: { ...form.test, time: e.target.value } })}
                  className="mock-sheet-control"
                />
              </label>
            </div>
            <label className="mock-sheet-label">
              Test centre
              <input
                value={form.test.testCentre}
                onChange={(e) => setForm({ ...form, test: { ...form.test, testCentre: e.target.value } })}
                className="mock-sheet-control"
              />
            </label>
            <label className="mock-sheet-label">
              Route / notes
              <input
                value={form.test.routeDescription}
                onChange={(e) => setForm({ ...form, test: { ...form.test, routeDescription: e.target.value } })}
                className="mock-sheet-control"
              />
            </label>
            <label className="mock-sheet-label">
              Duration (min)
              <input
                value={form.test.durationMinutes}
                onChange={(e) => setForm({ ...form, test: { ...form.test, durationMinutes: e.target.value } })}
                className="mock-sheet-control"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="mock-sheet-check gap-1.5">
                <input
                  type="checkbox"
                  checked={form.test.resultsByPost ?? false}
                  onChange={(e) => setForm({ ...form, test: { ...form.test, resultsByPost: e.target.checked } })}
                  className="h-3.5 w-3.5"
                />
                Post
              </label>
              <label className="mock-sheet-check gap-1.5">
                <input
                  type="checkbox"
                  checked={form.test.resultsByEmail ?? false}
                  onChange={(e) => setForm({ ...form, test: { ...form.test, resultsByEmail: e.target.checked } })}
                  className="h-3.5 w-3.5"
                />
                Email
              </label>
              <input
                type="email"
                placeholder="Email"
                value={form.test.resultsEmailAddress}
                onChange={(e) => setForm({ ...form, test: { ...form.test, resultsEmailAddress: e.target.value } })}
              className="mock-sheet-control min-w-[10rem] flex-1 py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="mock-sheet-eyebrow">Declaration</p>
            <p className="mock-sheet-body text-brand-700">
              By taking the test you declare that your vehicle is insured, taxed, UK-registered, and that you meet residency
              requirements, as required for a driving test. This tool is for mock recording only.
            </p>
            <label className="mock-sheet-check-start">
              <input
                type="checkbox"
                checked={form.declarationConsent ?? false}
                onChange={(e) => setForm({ ...form, declarationConsent: e.target.checked })}
                className="mt-0.5 h-3.5 w-3.5"
              />
              Candidate confirms declaration &amp; consents to test data recorded here.
            </label>
          </div>
        </div>

        <div className="border-t border-brand-100 bg-brand-50/40 px-3 py-3">
          <p className="mock-sheet-eyebrow">Instructor &amp; vehicle</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <label className="mock-sheet-label">
              Instructor reg
              <input
                value={form.instructorVehicle.instructorReg}
                onChange={(e) =>
                  setForm({
                    ...form,
                    instructorVehicle: { ...form.instructorVehicle, instructorReg: e.target.value },
                  })
                }
                className="mock-sheet-control"
              />
            </label>
            <label className="mock-sheet-label">
              Vehicle reg
              <input
                value={form.instructorVehicle.vehicleReg}
                onChange={(e) =>
                  setForm({ ...form, instructorVehicle: { ...form.instructorVehicle, vehicleReg: e.target.value } })
                }
                className="mock-sheet-control font-mono uppercase tracking-wider"
                maxLength={8}
              />
            </label>
            <div className="flex flex-wrap gap-3 text-sm font-normal text-brand-800">
              <span className="self-end pb-1 text-brand-600">Transmission</span>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.instructorVehicle.transmissionManual ?? false}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      instructorVehicle: { ...form.instructorVehicle, transmissionManual: e.target.checked },
                    })
                  }
                />
                Manual
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.instructorVehicle.transmissionAuto ?? false}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      instructorVehicle: { ...form.instructorVehicle, transmissionAuto: e.target.checked },
                    })
                  }
                />
                Automatic
              </label>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-normal text-brand-800 md:col-span-2">
              <span className="w-full text-brand-600">Accompanied by</span>
              {(
                [
                  ["accompaniedIns", "Ins"],
                  ["accompaniedSup", "Sup"],
                  ["accompaniedInt", "Int"],
                  ["accompaniedOther", "Other"],
                ] as const
              ).map(([key, lab]) => (
                <label key={key} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={Boolean(form.instructorVehicle[key])}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        instructorVehicle: { ...form.instructorVehicle, [key]: e.target.checked },
                      })
                    }
                  />
                  {lab}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-normal text-brand-800">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.instructorVehicle.schoolCar ?? false}
                  onChange={(e) =>
                    setForm({ ...form, instructorVehicle: { ...form.instructorVehicle, schoolCar: e.target.checked } })
                  }
                />
                School car
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.instructorVehicle.dualControl ?? false}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      instructorVehicle: { ...form.instructorVehicle, dualControl: e.target.checked },
                    })
                  }
                />
                Dual control
              </label>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* Fault recording, three columns matching reference bands */}
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 bg-brand-50/80 px-4 py-3">
          <h2 className="mock-sheet-h2">Fault recording</h2>
          <p className="mock-sheet-body mt-1.5">
            Tap the circle for each driving fault. S / D = serious / dangerous. On the same line, more than {MINOR_TALLY_CAP}{" "}
            minors count as <strong className="font-semibold text-brand-800">one serious fault</strong> (4th tap onward).
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-3 md:gap-4">
          {/* Column 1 */}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="rounded-lg border border-brand-200 bg-white p-2 shadow-sm">
              <h3 className="mock-sheet-card-title">Eyesight test</h3>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-normal text-brand-800">
                {[
                  ["codeAs", "AS"],
                  ["codeNs1", "NS"],
                  ["codeNs2", "NS"],
                  ["codeHsDs", "HS/DS"],
                ].map(([k, lab]) => (
                  <label key={k} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={Boolean(form.eyesight[k as keyof typeof form.eyesight])}
                      onChange={(e) =>
                        setForm({ ...form, eyesight: { ...form.eyesight, [k]: e.target.checked } as typeof form.eyesight })
                      }
                    />
                    {lab}
                  </label>
                ))}
              </div>
              <label className="mock-sheet-inline-field">
                Notes
                <input
                  value={form.eyesight.notes}
                  onChange={(e) => setForm({ ...form, eyesight: { ...form.eyesight, notes: e.target.value } })}
                  className="mock-sheet-control"
                />
              </label>
            </div>

            <div className="rounded-lg border border-brand-200 bg-white p-2 shadow-sm">
              <h3 className="mock-sheet-card-title">Manoeuvres</h3>
              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-sm font-normal text-brand-800">
                {(
                  [
                    ["reverseRight", "Reverse / right"],
                    ["parallelPark", "Parallel park"],
                    ["forwardBay", "Forward bay"],
                    ["pullUpRight", "Pull up right"],
                  ] as const
                ).map(([k, lab]) => (
                  <label key={k} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={Boolean(form.manoeuvreTypes[k])}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          manoeuvreTypes: { ...form.manoeuvreTypes, [k]: e.target.checked },
                        })
                      }
                    />
                    {lab}
                  </label>
                ))}
              </div>
              <div className="mt-2 border-t border-brand-100 pt-2">
                <p className="mock-sheet-eyebrow">Faults</p>
                {renderFaultCard(ALL_FAULT_SECTIONS.find((s) => s.key === "manoeuvres")!, { showSectionTitle: false })}
              </div>
            </div>

            {col1.map((sec) => (
              <div key={sec.key}>{renderFaultCard(sec)}</div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="flex min-w-0 flex-col gap-2">
            {col2.map((sec) => (
              <div key={sec.key}>{renderFaultCard(sec)}</div>
            ))}
            <div className="rounded-lg border border-brand-200 bg-white p-2 shadow-sm">
              <h3 className="mock-sheet-card-title">ETA (examiner took action)</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-sm font-normal text-brand-800">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.sheetChecks.etaPhysical ?? false}
                    onChange={(e) =>
                      setForm({ ...form, sheetChecks: { ...form.sheetChecks, etaPhysical: e.target.checked } })
                    }
                  />
                  Physical
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.sheetChecks.etaVerbal ?? false}
                    onChange={(e) =>
                      setForm({ ...form, sheetChecks: { ...form.sheetChecks, etaVerbal: e.target.checked } })
                    }
                  />
                  Verbal
                </label>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex min-w-0 flex-col gap-2">
            {col3.map((sec) => (
              <div key={sec.key}>{renderFaultCard(sec)}</div>
            ))}
            <div className="rounded-lg border border-brand-200 bg-white p-2 shadow-sm">
              <h3 className="mock-sheet-card-title">Total faults</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-sm font-normal text-brand-800">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.sheetChecks.totalPass ?? false}
                    onChange={(e) =>
                      setForm({ ...form, sheetChecks: { ...form.sheetChecks, totalPass: e.target.checked } })
                    }
                  />
                  Pass
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.sheetChecks.totalFail ?? false}
                    onChange={(e) =>
                      setForm({ ...form, sheetChecks: { ...form.sheetChecks, totalFail: e.target.checked } })
                    }
                  />
                  Fail
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.sheetChecks.totalNone ?? false}
                    onChange={(e) =>
                      setForm({ ...form, sheetChecks: { ...form.sheetChecks, totalNone: e.target.checked } })
                    }
                  />
                  None
                </label>
              </div>
            </div>
            <div className="rounded-lg border border-brand-200 bg-white p-2 shadow-sm">
              <h3 className="mock-sheet-card-title">ECO</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-sm font-normal text-brand-800">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.sheetChecks.ecoControl ?? false}
                    onChange={(e) =>
                      setForm({ ...form, sheetChecks: { ...form.sheetChecks, ecoControl: e.target.checked } })
                    }
                  />
                  Control
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.sheetChecks.ecoPlanning ?? false}
                    onChange={(e) =>
                      setForm({ ...form, sheetChecks: { ...form.sheetChecks, ecoPlanning: e.target.checked } })
                    }
                  />
                  Planning
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Post-test block */}
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 bg-brand-50/80 px-4 py-3">
          <h2 className="mock-sheet-h2">After test</h2>
        </div>
        <div className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-wrap items-center gap-4 text-sm font-normal text-brand-800">
            <span>Licence received</span>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={form.postTest.licenceReceivedYes ?? false}
                onChange={(e) =>
                  setForm({ ...form, postTest: { ...form.postTest, licenceReceivedYes: e.target.checked } })
                }
              />
              Yes
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={form.postTest.licenceReceivedNo ?? false}
                onChange={(e) =>
                  setForm({ ...form, postTest: { ...form.postTest, licenceReceivedNo: e.target.checked } })
                }
              />
              No
            </label>
          </div>
          <label className="mock-sheet-label">
            Pass certificate no.
            <input
              value={form.postTest.passCertificateNumber}
              onChange={(e) =>
                setForm({ ...form, postTest: { ...form.postTest, passCertificateNumber: e.target.value } })
              }
              className="mock-sheet-control max-w-xs font-mono tracking-widest"
              maxLength={16}
            />
          </label>
        </div>
        <label className="mock-sheet-label">
          Physical description of candidate
          <textarea
            value={form.postTest.physicalDescription}
            onChange={(e) =>
              setForm({ ...form, postTest: { ...form.postTest, physicalDescription: e.target.value } })
            }
            rows={2}
            className="mock-sheet-control"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-4">
          <label className="mock-sheet-label">
            Activity code
            <input
              value={form.postTest.activityCode}
              onChange={(e) => setForm({ ...form, postTest: { ...form.postTest, activityCode: e.target.value } })}
              className="mock-sheet-control"
            />
          </label>
          <label className="mock-sheet-label">
            Route number
            <input
              value={form.postTest.routeNumber}
              onChange={(e) => setForm({ ...form, postTest: { ...form.postTest, routeNumber: e.target.value } })}
              className="mock-sheet-control"
            />
          </label>
          <div className="sm:col-span-2">
            <p className="font-heading text-sm font-semibold text-brand-800">Independent driving</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm font-normal text-brand-800">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.postTest.independentDrivingSatNav ?? false}
                  onChange={(e) =>
                    setForm({ ...form, postTest: { ...form.postTest, independentDrivingSatNav: e.target.checked } })
                  }
                />
                Sat nav
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.postTest.independentDrivingTrafficSigns ?? false}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      postTest: { ...form.postTest, independentDrivingTrafficSigns: e.target.checked },
                    })
                  }
                />
                Traffic signs
              </label>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-normal text-brand-800">
          <span>Debrief witnessed</span>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.postTest.debriefWitnessedYes ?? false}
              onChange={(e) =>
                setForm({ ...form, postTest: { ...form.postTest, debriefWitnessedYes: e.target.checked } })
              }
            />
            Yes
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.postTest.debriefWitnessedNo ?? false}
              onChange={(e) =>
                setForm({ ...form, postTest: { ...form.postTest, debriefWitnessedNo: e.target.checked } })
              }
            />
            No
          </label>
        </div>
        <label className="mock-sheet-label">
          Show me / Tell me question(s)
          <textarea
            value={form.postTest.showMeTellMeQuestions}
            onChange={(e) =>
              setForm({ ...form, postTest: { ...form.postTest, showMeTellMeQuestions: e.target.value } })
            }
            rows={2}
            className="mock-sheet-control"
          />
        </label>
        <label className="mock-sheet-label">
          Additional information
          <textarea
            value={form.postTest.additionalInformation}
            onChange={(e) =>
              setForm({ ...form, postTest: { ...form.postTest, additionalInformation: e.target.value } })
            }
            rows={2}
            className="mock-sheet-control"
          />
        </label>

        <div>
            <p className="mock-sheet-eyebrow">Weather conditions</p>
          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3">
            {WEATHER_SHEET_OPTIONS.map((w) => {
              const key = `weatherCode${w.code}` as const;
              return (
                <label key={w.code} className="mock-sheet-check-start">
                  <input
                    type="checkbox"
                    checked={Boolean(form.postTest[key])}
                    onChange={(e) =>
                      setForm({ ...form, postTest: { ...form.postTest, [key]: e.target.checked } })
                    }
                  />
                  <span>
                    {w.code}. {w.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <label className="mock-sheet-label">
          Fault descriptions
          <textarea
            value={form.postTest.faultDescriptions}
            onChange={(e) =>
              setForm({ ...form, postTest: { ...form.postTest, faultDescriptions: e.target.value } })
            }
            rows={4}
            className="mock-sheet-control"
          />
        </label>
        <label className="mock-sheet-label">
          Examiner&apos;s signature
          <input
            value={form.postTest.examinerSignature}
            onChange={(e) =>
              setForm({ ...form, postTest: { ...form.postTest, examinerSignature: e.target.value } })
            }
            className="mock-sheet-control"
          />
        </label>
        <div className="flex flex-wrap gap-4 text-sm font-normal text-brand-800">
          <span>Reason for use</span>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.postTest.reasonIpadFault ?? false}
              onChange={(e) =>
                setForm({ ...form, postTest: { ...form.postTest, reasonIpadFault: e.target.checked } })
              }
            />
            iPad fault
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.postTest.reasonTransfer ?? false}
              onChange={(e) =>
                setForm({ ...form, postTest: { ...form.postTest, reasonTransfer: e.target.checked } })
              }
            />
            Transfer
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.postTest.reasonOther ?? false}
              onChange={(e) =>
                setForm({ ...form, postTest: { ...form.postTest, reasonOther: e.target.checked } })
              }
            />
            Other
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="mock-sheet-label">
            Examiner scheduled on journal
            <input
              value={form.postTest.examinerScheduledOnJournal}
              onChange={(e) =>
                setForm({ ...form, postTest: { ...form.postTest, examinerScheduledOnJournal: e.target.value } })
              }
              className="mock-sheet-control"
            />
          </label>
          <label className="mock-sheet-label">
            Examiner who conducted test
            <input
              value={form.postTest.examinerWhoConductedTest}
              onChange={(e) =>
                setForm({ ...form, postTest: { ...form.postTest, examinerWhoConductedTest: e.target.value } })
              }
              className="mock-sheet-control"
            />
          </label>
          <label className="mock-sheet-label">
            Date of re-key
            <input
              value={form.postTest.dateOfRekey}
              onChange={(e) => setForm({ ...form, postTest: { ...form.postTest, dateOfRekey: e.target.value } })}
              className="mock-sheet-control"
            />
          </label>
          <label className="mock-sheet-label">
            Re-keyed by
            <input
              value={form.postTest.rekeyedBy}
              onChange={(e) => setForm({ ...form, postTest: { ...form.postTest, rekeyedBy: e.target.value } })}
              className="mock-sheet-control"
            />
          </label>
        </div>
        </div>
      </section>

      {!cab.isOpen ? (
      <>
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 bg-brand-50/80 px-4 py-3">
          <h2 className="mock-sheet-h2">Instructor notes</h2>
        </div>
        <div className="p-4">
        <textarea
          value={form.instructorNotes}
          onChange={(e) => setForm({ ...form, instructorNotes: e.target.value })}
          rows={3}
          className="mock-sheet-control min-h-[5.5rem]"
        />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 bg-brand-50/80 px-4 py-3">
          <h2 className="mock-sheet-h2">Link to pupil</h2>
        </div>
        <div className="p-4">
        <p className="mock-sheet-body">
          Optional. For your records and future pupil summary views.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="mock-sheet-label">
            Existing pupil
            <select
              value={pupilId ?? ""}
              onChange={(e) => onSelectPupil(e.target.value)}
              className="mock-sheet-control"
            >
              <option value="">Manual entry</option>
              {pupils.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.pupil_name} ({p.pupil_email})
                </option>
              ))}
            </select>
          </label>
          <label className="mock-sheet-label">
            Pupil name
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="mock-sheet-control"
            />
          </label>
          <label className="mock-sheet-label sm:col-span-2">
            Pupil email
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="mock-sheet-control"
            />
          </label>
        </div>
        </div>
      </section>

      <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 text-sm shadow-sm">
        <p className="font-heading text-sm font-semibold tracking-tight text-teal-900">Preview</p>
        <p className="mock-sheet-body text-brand-800">
          Weak areas: {live.summary.weakCategories.slice(0, 3).join(", ") || "None recorded"}
        </p>
        <Link
          href="/instructor/mock-tests"
          className="mt-2 inline-block font-heading text-sm font-semibold text-teal-800 underline-offset-2 hover:underline"
        >
          All mock tests
        </Link>
        {testId ? <span className="ml-2 font-mono text-brand-400">id {testId}</span> : null}
      </section>
      </>
      ) : null}
      </div>
    </div>
  );
}
