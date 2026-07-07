import { z } from "zod";

import {
  LEGACY_POSITIONING_ROW_IDS,
  LEGACY_POSITIONING_ROW_TO_SECTION,
} from "@/lib/instructor/mock-test-rows";

/** Legacy cells stored `"minor"` | `"serious"` | `"dangerous"` or new tallies object. */
export function normalizeFaultCell(raw: unknown): { minorCount: number; seriousCount: number; dangerous: boolean } {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if ("minorCount" in o || "seriousCount" in o || "serious" in o || "dangerous" in o) {
      const n = typeof o.minorCount === "number" ? Math.floor(o.minorCount) : 0;
      let seriousCount = 0;
      if (typeof o.seriousCount === "number") {
        seriousCount = Math.floor(o.seriousCount);
      } else if (Boolean(o.serious)) {
        seriousCount = 1;
      }
      return {
        minorCount: Math.min(99, Math.max(0, n)),
        seriousCount: Math.min(99, Math.max(0, seriousCount)),
        dangerous: Boolean(o.dangerous),
      };
    }
  }
  const s = typeof raw === "string" ? raw : "";
  if (s === "minor") return { minorCount: 1, seriousCount: 0, dangerous: false };
  if (s === "serious") return { minorCount: 0, seriousCount: 1, dangerous: false };
  if (s === "dangerous") return { minorCount: 0, seriousCount: 0, dangerous: true };
  return { minorCount: 0, seriousCount: 0, dangerous: false };
}

export function hasFaultMarks(m: { minorCount: number; seriousCount: number; dangerous: boolean }): boolean {
  return m.minorCount > 0 || m.seriousCount > 0 || m.dangerous;
}

const faultCellSchema = z.preprocess(
  (raw) => normalizeFaultCell(raw),
  z.object({
    minorCount: z.number().int().min(0).max(99),
    seriousCount: z.number().int().min(0).max(99),
    dangerous: z.boolean(),
  }),
);

const faultMapSchema = z.record(z.string(), faultCellSchema);

function migratePositioningRows(o: Record<string, unknown>) {
  const pc = o.positioningCore;
  if (!pc || typeof pc !== "object" || Array.isArray(pc)) return;

  const core = { ...(pc as Record<string, unknown>) };
  for (const rowId of LEGACY_POSITIONING_ROW_IDS) {
    if (!(rowId in core)) continue;

    const coreMarks = normalizeFaultCell(core[rowId]);
    const targetSection = LEGACY_POSITIONING_ROW_TO_SECTION[rowId];
    const existing = o[targetSection];
    const target =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    const targetMarks = normalizeFaultCell(target[rowId]);

    delete core[rowId];

    // Empty legacy cells must not overwrite faults saved in the split section (e.g. useOfSpeed).
    if (!hasFaultMarks(coreMarks)) continue;
    if (hasFaultMarks(targetMarks)) continue;

    target[rowId] = coreMarks;
    o[targetSection] = target;
  }
  o.positioningCore = core;
}

function prepPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const o = { ...(raw as Record<string, unknown>) };

  const pr = o.positioningRest;
  const pc = o.positioningCore;
  if (pr && typeof pr === "object") {
    o.positioningCore = {
      ...(typeof pc === "object" && pc !== null && !Array.isArray(pc) ? (pc as Record<string, unknown>) : {}),
      ...(pr as Record<string, unknown>),
    };
    delete o.positioningRest;
  }

  migratePositioningRows(o);

  if (typeof o.faultDescriptions === "string" && (!o.postTest || typeof o.postTest !== "object")) {
    o.postTest = {
      ...(typeof o.postTest === "object" && o.postTest !== null ? o.postTest : {}),
      faultDescriptions: o.faultDescriptions,
    };
    delete o.faultDescriptions;
  }
  if (typeof o.examinerSignature === "string" && o.postTest && typeof o.postTest === "object" && !("examinerSignature" in (o.postTest as object))) {
    (o.postTest as Record<string, unknown>).examinerSignature = o.examinerSignature;
    delete o.examinerSignature;
  }

  const iv = o.instructorVehicle;
  if ((!iv || typeof iv !== "object") && o.instructorBlock && typeof o.instructorBlock === "object") {
    const ib = o.instructorBlock as Record<string, unknown>;
    o.instructorVehicle = {
      instructorReg: String(ib.adiOrCrb ?? ib.name ?? ""),
      vehicleReg: String(ib.vehicleReg ?? ""),
      transmissionManual: false,
      transmissionAuto: false,
      accompaniedIns: false,
      accompaniedSup: false,
      accompaniedInt: false,
      accompaniedOther: false,
      schoolCar: false,
      dualControl: false,
    };
  }

  const cand = o.candidate;
  if (cand && typeof cand === "object" && cand !== null && !("driverNo" in cand) && "provisionalLicence" in cand) {
    o.candidate = {
      ...(cand as object),
      driverNo: String((cand as Record<string, unknown>).provisionalLicence ?? ""),
    };
  }
  return o;
}

export const mockTestFormPayloadSchema = z.preprocess(
  prepPayload,
  z.object({
    candidate: z.object({
      fullName: z.string(),
      address: z.string(),
      appRef: z.string(),
      driverNo: z.string(),
      instructorCar: z.boolean().optional(),
    }),
    test: z.object({
      category: z.string(),
      date: z.string(),
      time: z.string(),
      testCentre: z.string(),
      routeDescription: z.string(),
      durationMinutes: z.string(),
      resultsByPost: z.boolean().optional(),
      resultsByEmail: z.boolean().optional(),
      resultsEmailAddress: z.string(),
    }),
    declarationConsent: z.boolean().optional(),
    instructorVehicle: z.object({
      instructorReg: z.string(),
      vehicleReg: z.string(),
      transmissionManual: z.boolean().optional(),
      transmissionAuto: z.boolean().optional(),
      accompaniedIns: z.boolean().optional(),
      accompaniedSup: z.boolean().optional(),
      accompaniedInt: z.boolean().optional(),
      accompaniedOther: z.boolean().optional(),
      schoolCar: z.boolean().optional(),
      dualControl: z.boolean().optional(),
    }),
    eyesight: z.object({
      codeAs: z.boolean().optional(),
      codeNs1: z.boolean().optional(),
      codeNs2: z.boolean().optional(),
      codeHsDs: z.boolean().optional(),
      notes: z.string(),
    }),
    manoeuvreTypes: z.object({
      reverseRight: z.boolean().optional(),
      parallelPark: z.boolean().optional(),
      forwardBay: z.boolean().optional(),
      pullUpRight: z.boolean().optional(),
    }),
    manoeuvres: faultMapSchema,
    showMeTellMe: faultMapSchema,
    controlledStop: faultMapSchema,
    control: faultMapSchema,
    moveOff: faultMapSchema,
    mirrors: faultMapSchema,
    signals: faultMapSchema,
    junctions: faultMapSchema,
    judgement: faultMapSchema,
    positioningCore: faultMapSchema,
    pedestrianCrossings: faultMapSchema,
    positionNormalStop: faultMapSchema,
    awarenessPlanning: faultMapSchema,
    clearance: faultMapSchema,
    followingDistance: faultMapSchema,
    useOfSpeed: faultMapSchema,
    progress: faultMapSchema,
    responseSigns: faultMapSchema,
    sheetChecks: z.object({
      etaPhysical: z.boolean().optional(),
      etaVerbal: z.boolean().optional(),
      ecoControl: z.boolean().optional(),
      ecoPlanning: z.boolean().optional(),
      totalPass: z.boolean().optional(),
      totalFail: z.boolean().optional(),
      totalNone: z.boolean().optional(),
    }),
    postTest: z.object({
      licenceReceivedYes: z.boolean().optional(),
      licenceReceivedNo: z.boolean().optional(),
      passCertificateNumber: z.string(),
      physicalDescription: z.string(),
      activityCode: z.string(),
      routeNumber: z.string(),
      independentDrivingSatNav: z.boolean().optional(),
      independentDrivingTrafficSigns: z.boolean().optional(),
      debriefWitnessedYes: z.boolean().optional(),
      debriefWitnessedNo: z.boolean().optional(),
      showMeTellMeQuestions: z.string(),
      additionalInformation: z.string(),
      weatherCode1: z.boolean().optional(),
      weatherCode2: z.boolean().optional(),
      weatherCode3: z.boolean().optional(),
      weatherCode4: z.boolean().optional(),
      weatherCode5: z.boolean().optional(),
      weatherCode6: z.boolean().optional(),
      weatherCode7: z.boolean().optional(),
      weatherCode8: z.boolean().optional(),
      weatherCode9: z.boolean().optional(),
      weatherCode10: z.boolean().optional(),
      weatherCode11: z.boolean().optional(),
      faultDescriptions: z.string(),
      examinerSignature: z.string(),
      reasonIpadFault: z.boolean().optional(),
      reasonTransfer: z.boolean().optional(),
      reasonOther: z.boolean().optional(),
      examinerScheduledOnJournal: z.string(),
      examinerWhoConductedTest: z.string(),
      dateOfRekey: z.string(),
      rekeyedBy: z.string(),
    }),
    instructorNotes: z.string(),
  }),
);

export type MockTestFormPayload = z.infer<typeof mockTestFormPayloadSchema>;
