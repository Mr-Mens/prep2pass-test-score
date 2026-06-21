import { Button } from "@/components/Button";
import { PRICING, BRAND_CTA } from "@/lib/constants";
import { PricingTrustBadges } from "@/components/marketing/PricingTrustBadges";

const learnerIncludes = [
  "Unlimited Pass Pilot Score assessments",
  "Premium reports and Progress Insights",
  "Learning Journey tracking",
  "Structured coaching guidance",
  "AI-powered debriefs",
  "Supervisor and instructor sharing",
] as const;

const freeIncludes = [
  "Instructor Coaching Tools",
  "Teaching Diagrams",
  "Pupil progress view",
  "Supervisor practice support",
  "Referral rewards for instructors",
] as const;

function TrustBadgePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1 text-[11px] font-semibold text-teal-900">
      {children}
    </span>
  );
}

type Props = {
  hideLearnerCard?: boolean;
};

export function LandingPricing({ hideLearnerCard = false }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:gap-6 lg:items-stretch">
      {!hideLearnerCard ? (
        <div className="relative flex h-full flex-col rounded-2xl border-2 border-teal-400/70 bg-gradient-to-b from-teal-50/50 to-white p-6 shadow-[0_8px_40px_rgba(15,118,110,0.12)] ring-1 ring-teal-900/[0.06] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold tracking-tight text-brand-950">Pass Pilot for learners</h3>
              <p className="mt-1 text-sm leading-relaxed text-brand-600">Full platform access until you pass or cancel</p>
            </div>
            <span className="shrink-0 rounded-full bg-teal-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Learners
            </span>
          </div>
          <p className="mt-6 text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
            {PRICING.subscription.display}
            <span className="ml-2 text-xl font-medium text-brand-500">/ month</span>
          </p>
          <p className="mt-2 text-sm font-medium text-brand-700">Until you pass or cancel</p>
          <PricingTrustBadges className="mt-4" />
          <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-brand-800">
            {learnerIncludes.map((b) => (
              <li key={b} className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <TrustBadgePill>No long-term contract</TrustBadgePill>
            <TrustBadgePill>Cancel anytime</TrustBadgePill>
          </div>
          <div className="mt-4 rounded-xl border border-teal-200/70 bg-teal-50/50 px-4 py-3 text-xs leading-relaxed text-teal-950">
            Record your pass and we&apos;ll automatically stop future billing.
          </div>
          <div className="mt-8 border-t border-teal-100/90 pt-8">
            <Button href="/assessment" variant="conversion" className="w-full">
              {BRAND_CTA.getMyScore}
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={`flex h-full flex-col rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02] sm:p-8 sm:ring-0 ${hideLearnerCard ? "lg:col-span-2" : ""}`}
      >
        <h3 className="text-lg font-semibold tracking-tight text-brand-950">Instructors &amp; Supervisors</h3>
        <p className="mt-1 text-sm leading-relaxed text-brand-600">Free forever</p>
        <p className="mt-6 text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">Free</p>
        <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-brand-800">
          {freeIncludes.map((b) => (
            <li key={b} className="flex gap-3">
              <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-brand-500">
          Referral payout tracking available for instructors. Payouts coming soon.
        </p>
        <div className="mt-8 border-t border-brand-100 pt-8">
          <Button href="/welcome" variant="secondary" className="w-full">
            Choose your role
          </Button>
        </div>
      </div>

      {!hideLearnerCard ? (
        <p className="text-center text-xs leading-relaxed text-brand-600 lg:col-span-2">
          {PRICING.subscription.display}/month until you pass or cancel · Secure Stripe checkout
        </p>
      ) : null}
    </div>
  );
}
