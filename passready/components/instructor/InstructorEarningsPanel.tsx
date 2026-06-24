import { COMMERCIAL, formatPenceGbp } from "@/lib/commercial/constants";
import { InstructorPayoutRequestButton } from "@/components/instructor/InstructorPayoutRequestButton";
import {
  getInstructorReferralEarningsSummary,
  listOpenPayoutRequestsForInstructor,
  listRecentInstructorCommissions,
} from "@/lib/server/repositories/instructor-commissions-repository";

type Props = {
  instructorUserId: string;
};

function formatCommissionStatus(status: string): string {
  if (status === "eligible") return "Eligible";
  if (status === "paid") return "Paid";
  if (status === "void") return "Void";
  return "Pending";
}

function formatPaymentDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export async function InstructorEarningsPanel({ instructorUserId }: Props) {
  let summary;
  let commissions;
  let openRequests;
  try {
    [summary, commissions, openRequests] = await Promise.all([
      getInstructorReferralEarningsSummary(instructorUserId),
      listRecentInstructorCommissions(instructorUserId),
      listOpenPayoutRequestsForInstructor(instructorUserId),
    ]);
  } catch {
    return null;
  }

  const stats = [
    { label: "Active referred pupils", value: String(summary.activeReferredPupils) },
    {
      label: "This month’s estimated earnings",
      value: formatPenceGbp(summary.monthlyEstimatedPence),
    },
    { label: "Lifetime earned", value: formatPenceGbp(summary.lifetimeEarnedPence) },
    { label: "Available for payout", value: formatPenceGbp(summary.availableForPayoutPence) },
    {
      label: "Pending payout requests",
      value: formatPenceGbp(summary.pendingPayoutRequestPence),
    },
  ];

  return (
    <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-card ring-1 ring-brand-50 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800/90">Referral earnings</p>
          <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-brand-950 sm:text-2xl">
            Instructor rewards
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-600">{COMMERCIAL.referral.headline}</p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-600">{COMMERCIAL.referral.paymentNote}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-4 text-center sm:text-left"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">{stat.label}</p>
            <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-brand-950">{stat.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-brand-700">
        Instructors earn {COMMERCIAL.referral.commissionPercentLabel} recurring commission from successful learner
        subscription payments they refer. Payouts are currently processed manually once your available balance reaches{" "}
        {COMMERCIAL.referral.minPayoutLabel}.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-brand-500">{COMMERCIAL.referral.payoutNote}</p>

      <InstructorPayoutRequestButton
        availableForPayoutPence={summary.availableForPayoutPence}
        minPayoutPence={summary.minPayoutPence}
        hasOpenRequest={openRequests.length > 0}
      />

      <div className="mt-8 overflow-x-auto">
        <h3 className="font-heading text-lg font-semibold text-brand-950">Recent commissions</h3>
        {commissions.length === 0 ? (
          <p className="mt-3 text-sm text-brand-600">No commission payments recorded yet.</p>
        ) : (
          <table className="mt-4 min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-[11px] font-semibold uppercase tracking-wide text-brand-500">
                <th className="px-3 py-2">Pupil</th>
                <th className="px-3 py-2">Payment date</th>
                <th className="px-3 py-2">Gross payment</th>
                <th className="px-3 py-2">Commission</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((row) => (
                <tr key={row.id} className="border-b border-brand-50 text-brand-800">
                  <td className="px-3 py-3">
                    <div className="font-medium text-brand-950">{row.pupilName ?? "Learner"}</div>
                    <div className="text-xs text-brand-500">{row.pupilEmail}</div>
                  </td>
                  <td className="px-3 py-3">{formatPaymentDate(row.paymentDate)}</td>
                  <td className="px-3 py-3 tabular-nums">{formatPenceGbp(row.grossAmount)}</td>
                  <td className="px-3 py-3 tabular-nums">{formatPenceGbp(row.commissionAmount)}</td>
                  <td className="px-3 py-3">{formatCommissionStatus(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
