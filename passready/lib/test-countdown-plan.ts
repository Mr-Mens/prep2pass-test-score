import { pickCopyVariant } from "@/lib/deterministic-report-copy";
import { formatIsoDateUk } from "@/lib/formatting";

export type TestCountdownPlan = {
  testDate: string;
  dateLabel: string;
  daysRemaining: number;
  steps: string[];
};

export function daysUntilTestDate(testDate: string): number | null {
  const test = new Date(testDate);
  if (Number.isNaN(test.getTime())) return null;
  return (test.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

export function buildTestCountdownPlan(input: {
  testDate: string;
  salt: number;
  mockTestTaken?: boolean;
}): TestCountdownPlan | null {
  const days = daysUntilTestDate(input.testDate);
  if (days === null) return null;

  const dateLabel = formatIsoDateUk(input.testDate);
  const daysRemaining = Math.ceil(days);
  const daysRounded = Math.max(0, daysRemaining);
  const { salt } = input;
  const steps: string[] = [];

  if (days < 0) {
    steps.push(
      pickCopyVariant(salt, "next:testPast", [
        `Your saved test date was ${dateLabel}. If you rescheduled, run a fresh assessment with the new date so your plan stays accurate.`,
      ]),
    );
  } else if (daysRounded <= 7) {
    steps.push(
      pickCopyVariant(salt, "next:test7", [
        `Stick to familiar routes, polish observations, and keep drives shorter so you arrive rested.`,
        `Avoid brand-new manoeuvres. Repeat what you know and sleep well before test day.`,
      ]),
    );
  } else if (daysRounded <= 14) {
    steps.push(
      pickCopyVariant(salt, "next:test14", [
        `Use this fortnight for your weakest topics and a mock, then ease into lighter confidence drives in the final week.`,
        `Stack harder routes and weak areas now. Save the last few days for test-area practice and rest.`,
      ]),
    );
  } else if (daysRounded <= 28) {
    steps.push(
      pickCopyVariant(salt, "next:test28", [
        `Plan a mock at least two weeks before, then shift to test-centre routes in the final fortnight.`,
        `Work backwards: syllabus gaps and mocks in the next two weeks, then test-route repetition closer to the date.`,
      ]),
    );
  } else {
    steps.push(
      pickCopyVariant(salt, "next:testFar", [
        `Build syllabus breadth first, schedule a mock at least two weeks before, then increase test-area practice in the final month.`,
        `Map lessons backwards: weak areas and mocks first, then taper to familiar test routes in the last fortnight.`,
      ]),
    );
  }

  if (input.mockTestTaken === false && days >= 0) {
    if (daysRounded <= 7) {
      steps.push(
        pickCopyVariant(salt, "next:noMockSoon", [
          `You have not done a mock yet. Ask your instructor for a short test-route run if a full mock is not realistic now.`,
        ]),
      );
    } else if (daysRounded <= 14) {
      steps.push(
        pickCopyVariant(salt, "next:noMock14", [
          `Book a mock with your instructor this week if you can. With your test date set, you need exam-style pressure on the clock.`,
        ]),
      );
    } else {
      steps.push(
        pickCopyVariant(salt, "next:noMock", [
          `Book a mock at least two weeks before your test date. It is the closest safe proxy to exam pressure.`,
          `Plan a mock early enough that a poor result becomes data, not panic: two weeks ahead is a sensible minimum.`,
        ]),
      );
    }
  }

  return {
    testDate: input.testDate,
    dateLabel,
    daysRemaining,
    steps: Array.from(new Set(steps)),
  };
}

/** Stable numeric salt from a report id for copy variant selection. */
export function saltFromReportId(reportId: string): number {
  let h = 2166136261;
  for (let i = 0; i < reportId.length; i++) {
    h ^= reportId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
