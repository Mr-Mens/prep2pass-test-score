import { ALL_FAULT_SECTIONS, emptyFaultMap } from "@/lib/instructor/mock-test-rows";
import type { MockTestFormPayload } from "@/lib/instructor/mock-test-schemas";
import { mockTestFormPayloadSchema } from "@/lib/instructor/mock-test-schemas";

export function buildDefaultMockTestForm(): MockTestFormPayload {
  const faultSeed = {} as Pick<
    MockTestFormPayload,
    | "manoeuvres"
    | "showMeTellMe"
    | "controlledStop"
    | "control"
    | "moveOff"
    | "mirrors"
    | "signals"
    | "junctions"
    | "judgement"
    | "positioningCore"
    | "progress"
    | "responseSigns"
  >;
  for (const sec of ALL_FAULT_SECTIONS) {
    faultSeed[sec.key] = emptyFaultMap(sec.rows);
  }

  return {
    candidate: {
      fullName: "",
      address: "",
      appRef: "",
      driverNo: "",
      instructorCar: false,
    },
    test: {
      category: "B – Car",
      date: "",
      time: "",
      testCentre: "",
      routeDescription: "",
      durationMinutes: "",
      resultsByPost: false,
      resultsByEmail: false,
      resultsEmailAddress: "",
    },
    declarationConsent: false,
    instructorVehicle: {
      instructorReg: "",
      vehicleReg: "",
      transmissionManual: false,
      transmissionAuto: false,
      accompaniedIns: false,
      accompaniedSup: false,
      accompaniedInt: false,
      accompaniedOther: false,
      schoolCar: false,
      dualControl: false,
    },
    eyesight: {
      codeAs: false,
      codeNs1: false,
      codeNs2: false,
      codeHsDs: false,
      notes: "",
    },
    manoeuvreTypes: {
      reverseRight: false,
      parallelPark: false,
      forwardBay: false,
      pullUpRight: false,
    },
    sheetChecks: {
      etaPhysical: false,
      etaVerbal: false,
      ecoControl: false,
      ecoPlanning: false,
      totalPass: false,
      totalFail: false,
      totalNone: false,
    },
    postTest: {
      licenceReceivedYes: false,
      licenceReceivedNo: false,
      passCertificateNumber: "",
      physicalDescription: "",
      activityCode: "",
      routeNumber: "",
      independentDrivingSatNav: false,
      independentDrivingTrafficSigns: false,
      debriefWitnessedYes: false,
      debriefWitnessedNo: false,
      showMeTellMeQuestions: "",
      additionalInformation: "",
      weatherCode1: false,
      weatherCode2: false,
      weatherCode3: false,
      weatherCode4: false,
      weatherCode5: false,
      weatherCode6: false,
      weatherCode7: false,
      weatherCode8: false,
      weatherCode9: false,
      weatherCode10: false,
      weatherCode11: false,
      faultDescriptions: "",
      examinerSignature: "",
      reasonIpadFault: false,
      reasonTransfer: false,
      reasonOther: false,
      examinerScheduledOnJournal: "",
      examinerWhoConductedTest: "",
      dateOfRekey: "",
      rekeyedBy: "",
    },
    instructorNotes: "",
    ...faultSeed,
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMergeRecord(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (isPlainObject(v) && isPlainObject(base[k] as unknown)) {
      out[k] = deepMergeRecord(base[k] as Record<string, unknown>, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Merge saved JSON with current defaults so older records still load. */
export function mergeMockTestPayload(raw: unknown): MockTestFormPayload {
  const base = buildDefaultMockTestForm();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const merged = deepMergeRecord(base as unknown as Record<string, unknown>, raw as Record<string, unknown>);
  const parsed = mockTestFormPayloadSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}
