/** 15% recurring instructor referral commission on successful learner subscription payments. */
export const INSTRUCTOR_COMMISSION_RATE = 0.15 as const;

export const INSTRUCTOR_MIN_PAYOUT_PENCE = 2000;

export function calculateReferralCommissionAmount(
  amountPaidMinor: number,
  rate: number = INSTRUCTOR_COMMISSION_RATE,
): number {
  if (amountPaidMinor <= 0 || rate <= 0) return 0;
  return Math.round(amountPaidMinor * rate);
}
