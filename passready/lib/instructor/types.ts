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

export type MockTestSummary = {
  totalMinors: number;
  seriousCount: number;
  dangerousCount: number;
  failBecauseFault: boolean;
  failBecauseMinors: boolean;
  weakRowIds: string[];
  weakCategories: string[];
  suggestedFocus: string[];
};
