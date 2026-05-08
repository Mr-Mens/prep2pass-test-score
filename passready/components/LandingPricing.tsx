import { Button } from "@/components/Button";
import { PRICING } from "@/lib/constants";

const oneOffBullets = [
  "One premium report",
  "Readiness score",
  "Risk breakdown",
  "Coach note",
  "Lesson-hour estimate",
] as const;

const lifetimeBullets = [
  "Unlimited premium reports for your email/account",
  "Progress tracking",
  "Compare scores over time",
  "Updated action plans",
  "Saved report history",
] as const;

export function LandingPricing() {
  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:gap-6 lg:items-stretch">
      <div className="flex h-full flex-col rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02] sm:p-8 sm:ring-0">
        <h3 className="text-lg font-semibold tracking-tight text-brand-950">One-Off Report</h3>
        <p className="mt-1 text-sm leading-relaxed text-brand-600">For learners who want a single readiness check.</p>
        <p className="mt-6 text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">{PRICING.single.display}</p>
        <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-brand-800">
          {oneOffBullets.map((b) => (
            <li key={b} className="flex gap-3">
              <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-brand-100 pt-8">
          <Button href="/assessment" variant="conversion" className="w-full">
            Get My Test Ready Score
          </Button>
        </div>
      </div>

      <div className="relative flex h-full flex-col rounded-2xl border-2 border-teal-400/70 bg-gradient-to-b from-teal-50/50 to-white p-6 shadow-[0_8px_40px_rgba(15,118,110,0.12)] ring-1 ring-teal-900/[0.06] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-[60%] flex-1">
            <h3 className="text-lg font-semibold tracking-tight text-brand-950">Lifetime Progress Access</h3>
            <p className="mt-1 text-sm leading-relaxed text-brand-600">For learners who want to track improvement over time.</p>
          </div>
          <span className="shrink-0 rounded-full bg-teal-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
            Most popular
          </span>
        </div>
        <p className="mt-6 text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">{PRICING.lifetime.display}</p>
        <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-brand-800">
          {lifetimeBullets.map((b) => (
            <li key={b} className="flex gap-3">
              <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-teal-100/90 pt-8">
          <Button href="/assessment" variant="conversion" className="w-full">
            Get My Test Ready Score
          </Button>
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-brand-600 lg:col-span-2">
        Secure account · Your Premium reports remain private inside Prep2Pass and are not reopened by stray public links ·
        Stripe handles card payments securely.
      </p>
    </div>
  );
}
