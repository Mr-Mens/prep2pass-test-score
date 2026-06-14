/** V1 commercial model amounts and copy helpers. */
export const COMMERCIAL = {
  subscription: {
    display: "£6.99",
    amountPence: 699,
    interval: "month" as const,
    label: "Monthly subscription",
    hint: "Unlimited assessments, progress tracking, AI reports, and roadmap access.",
  },
  referral: {
    signupBonusPence: 200,
    monthlyCommissionPence: 100,
    maxCommissionMonths: 12,
    payoutStatusLabel: "Coming Soon",
  },
  roles: {
    instructor: "Free forever",
    parent: "Free forever",
  },
} as const;

export function formatPenceGbp(pence: number): string {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}
