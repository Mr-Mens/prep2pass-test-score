import type { MockTestFormPayload } from "@/lib/instructor/mock-test-schemas";

export type UserAppRole = "learner" | "instructor" | "parent";

/** Per competency row: repeat minors (DL25-style tallies), optional S/D. */
export type FaultMarks = {
  minorCount: number;
  serious: boolean;
  dangerous: boolean;
};

export type MockTestOutcome = "pass" | "fail" | "undecided";

export type { MockTestFormPayload };

export type MockTestRiskAreaEntry = {
  compositeId: string;
  sectionTitle: string;
  rowLabel: string;
  displayLabel: string;
  minorCount: number;
};

export type MockTestTopRiskAreas = {
  dangerous: MockTestRiskAreaEntry[];
  serious: MockTestRiskAreaEntry[];
  driving: MockTestRiskAreaEntry[];
};

export type MockTestSummary = {
  totalMinors: number;
  seriousCount: number;
  dangerousCount: number;
  failBecauseFault: boolean;
  failBecauseMinors: boolean;
  /** @deprecated use topRiskAreas */
  weakRowIds: string[];
  weakCategories: string[];
  suggestedFocus: string[];
  topRiskAreas: MockTestTopRiskAreas;
};
