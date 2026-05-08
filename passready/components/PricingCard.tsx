import { Button } from "@/components/Button";

const DEFAULT_BULLETS = [
  "Your readiness score, explained in plain English",
  "A breakdown of your highest-risk driving skills",
  "A focused action plan for your next lessons",
  "An instructor-style coach note",
  "A realistic band for how many more lesson hours you may need before test readiness",
] as const;

type PricingCardProps = {
  /** @deprecated use primaryPrice */
  price?: string;
  primaryPrice?: string;
  primarySub?: string;
  secondaryPrice?: string;
  secondarySub?: string;
  /** Product name shown as card title */
  productTitle?: string;
  bullets?: readonly string[];
  ctaHref?: string;
  ctaLabel?: string;
};

export function PricingCard({
  price,
  primaryPrice,
  primarySub = "One-off report",
  secondaryPrice,
  secondarySub = "Lifetime unlimited",
  productTitle = "Test Ready Score",
  bullets = DEFAULT_BULLETS,
  ctaHref = "/assessment",
  ctaLabel = "Get My Test Ready Score",
}: PricingCardProps) {
  const oneOff = primaryPrice ?? price ?? "";
  const showDual = Boolean(secondaryPrice);

  return (
    <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02] sm:p-8 sm:ring-0">
      <div className="border-b border-brand-100 pb-6">
        <h3 className="text-base font-semibold tracking-tight text-brand-950">{productTitle}</h3>
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">{oneOff}</p>
            <p className="mt-1 text-sm font-medium text-brand-600">{primarySub}</p>
          </div>
          {showDual ? (
            <div className="border-t border-brand-100 pt-4">
              <p className="text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">{secondaryPrice}</p>
              <p className="mt-1 text-sm font-medium text-brand-600">{secondarySub}</p>
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-sm font-medium text-brand-600">Secure checkout · No subscription</p>
      </div>

      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-brand-800">
        {bullets.map((b) => (
          <li key={b} className="flex gap-3">
            <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
              ✓
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-xl border border-teal-100/90 bg-teal-50/35 px-3 py-2.5 text-center text-xs leading-relaxed text-brand-700">
        One failed driving test costs £62+. This helps you avoid it.
      </p>

      <div className="mt-8 border-t border-brand-100/80 pt-8">
        <Button href={ctaHref} variant="conversion" className="w-full">
          {ctaLabel}
        </Button>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-brand-500/90">
        Secure account · Progress saved · Instant access · Payments via Stripe
      </p>
    </div>
  );
}
