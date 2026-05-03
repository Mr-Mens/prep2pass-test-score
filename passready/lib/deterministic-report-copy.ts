import type { AssessmentPayload } from "./validation";

/**
 * Stable integer derived from assessment fields so copy varies between learners
 * but stays identical for the same payload (no Math.random).
 */
export function reportCopySalt(assessment: AssessmentPayload): number {
  let h = 2166136261 >>> 0;
  const mix = (n: number) => {
    h ^= n >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  };

  mix(assessment.lessonsTaken);
  mix(assessment.seriousFaults);
  mix(assessment.drivingFaults);
  mix(assessment.confidenceLevel);
  for (const id of Array.from(new Set(assessment.weakAreas)).sort()) {
    mix(id.length);
    for (let i = 0; i < id.length; i++) mix(id.charCodeAt(i));
  }
  mix(assessment.mockTestTaken === "yes" ? 1 : 0);
  mix(
    assessment.mockTestResult === "pass" ? 1 : assessment.mockTestResult === "fail" ? 2 : 3,
  );
  mix(assessment.testBooked === "yes" ? 1 : 0);
  const email = assessment.email.trim().toLowerCase();
  const name = assessment.fullName.trim().toLowerCase();
  for (let i = 0; i < Math.min(48, email.length); i++) mix(email.charCodeAt(i));
  for (let i = 0; i < Math.min(24, name.length); i++) mix(name.charCodeAt(i));
  if (assessment.testDate) {
    for (let i = 0; i < assessment.testDate.length; i++) mix(assessment.testDate.charCodeAt(i));
  }
  return h >>> 0;
}

/** Pick one variant from a non-empty list; same salt + slot always picks the same index. */
export function pickCopyVariant<T>(salt: number, slot: string, variants: readonly [T, ...T[]]): T {
  let x = salt >>> 0;
  for (let i = 0; i < slot.length; i++) {
    x = Math.imul(x ^ slot.charCodeAt(i), 0x01000193) >>> 0;
  }
  return variants[x % variants.length]!;
}
