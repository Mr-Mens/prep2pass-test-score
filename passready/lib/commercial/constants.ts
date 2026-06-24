/** V1 commercial model amounts and copy helpers. */
import { INSTRUCTOR_COMMISSION_RATE, INSTRUCTOR_MIN_PAYOUT_PENCE } from "@/lib/commercial/commission";
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
    commissionRate: INSTRUCTOR_COMMISSION_RATE,
    commissionPercentLabel: "15%",
    minPayoutPence: INSTRUCTOR_MIN_PAYOUT_PENCE,
    minPayoutLabel: "£20",
    headline: "Earn 15% from referred learner subscriptions.",
    paymentNote: "Commission is calculated only after a successful learner payment.",
    payoutNote: "Payouts are manual for now and available from £20.",
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
