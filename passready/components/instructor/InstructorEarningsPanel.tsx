import { COMMERCIAL, formatPenceGbp } from "@/lib/commercial/constants";
import { getInstructorEarningsSummary } from "@/lib/server/repositories/referrals-repository";

type Props = {
  instructorUserId: string;
};

export async function InstructorEarningsPanel({ instructorUserId }: Props) {
  let summary;
  try {
    summary = await getInstructorEarningsSummary(instructorUserId);
  } catch {
    return null;
  }

  const stats = [
    { label: "Active referred pupils", value: String(summary.activeReferredPupils) },
    { label: "Passed pupils", value: String(summary.passedPupils) },
    {
      label: "Average readiness score",
      value: summary.averageReadinessScore != null ? `${summary.averageReadinessScore}/100` : "-",
    },
    { label: "Monthly earnings", value: formatPenceGbp(summary.monthlyEarningsPence) },
    { label: "Lifetime earnings", value: formatPenceGbp(summary.lifetimeEarningsPence) },
  ];

  return (
    <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-card ring-1 ring-brand-50 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800/90">Referral earnings</p>
          <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-brand-950 sm:text-2xl">
            Instructor rewards
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-600">
            {formatPenceGbp(COMMERCIAL.referral.signupBonusPence)} when a referred pupil subscribes, plus{" "}
            {formatPenceGbp(COMMERCIAL.referral.monthlyCommissionPence)} per active month (up to{" "}
            {COMMERCIAL.referral.maxCommissionMonths} months).
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200">
          Payouts · {COMMERCIAL.referral.payoutStatusLabel}
        </span>
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

      <p className="mt-5 text-xs leading-relaxed text-brand-500">
        Earnings are tracked automatically. Bank payouts are not live yet, all entries are marked{" "}
        {COMMERCIAL.referral.payoutStatusLabel} until payout processing ships.
      </p>
    </section>
  );
}
