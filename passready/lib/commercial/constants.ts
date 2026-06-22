/** V1 commercial model amounts and copy helpers. */
import { SMART_UI } from "@/lib/constants";

export const COMMERCIAL = {
  subscription: {
    display: "£6.99",
    amountPence: 699,
    interval: "month" as const,
    label: "Monthly subscription",
    hint: `Full platform access: Test Ready Score, ${SMART_UI.insights}, ${SMART_UI.reports}, and Learning Journey tracking.`,
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
    supervisor: "Free forever",
  },
} as const;

export function formatPenceGbp(pence: number): string {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}
