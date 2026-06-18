"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { PRICING } from "@/lib/constants";

const benefits = [
  "Unlimited assessments",
  "Progress tracking",
  "AI-powered Premium reports",
  "Roadmap insights",
] as const;

type Props = {
  initialPromoCode?: string;
  initialPremiumInvite?: string;
};

export function SubscribeFlow({ initialPromoCode = "", initialPremiumInvite = "" }: Props) {
  const searchParams = useSearchParams();
  const promoCode = useMemo(
    () => (searchParams.get("promo") ?? initialPromoCode).trim(),
    [initialPromoCode, searchParams],
  );
  const premiumInvite = useMemo(
    () => (searchParams.get("premiumInvite") ?? initialPremiumInvite).trim(),
    [initialPremiumInvite, searchParams],
  );

  const [manualPromo, setManualPromo] = useState(promoCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const body: {
        returnPath: string;
        promoCode?: string;
        premiumInvite?: string;
      } = { returnPath: "/subscribe/success" };

      if (premiumInvite) {
        body.premiumInvite = premiumInvite;
      } else if (manualPromo.trim()) {
        body.promoCode = manualPromo.trim();
      }

      const res = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { success?: boolean; url?: string; error?: { message?: string } | string };
      if (!json.success || !("url" in json) || !json.url) {
        const message =
          typeof json.error === "string"
            ? json.error
            : (json.error as { message?: string } | undefined)?.message ?? "Could not start checkout.";
        setError(message);
        return;
      }
      window.location.assign(json.url);
    } finally {
      setBusy(false);
    }
  }

  const hasInvite = Boolean(premiumInvite);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-white to-brand-50/50 p-8 shadow-card ring-1 ring-teal-100">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">Learner subscription</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950">
          {PRICING.subscription.display}
          <span className="ml-2 text-lg font-medium text-brand-500">/ month</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-700">{PRICING.subscription.hint}</p>

        {hasInvite ? (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
            Your premium invite discount will be applied at checkout.
          </p>
        ) : (
          <div className="mt-4">
            <label className="text-sm font-medium text-brand-900" htmlFor="subscribe-promo">
              Promo code (optional)
            </label>
            <input
              id="subscribe-promo"
              value={manualPromo}
              onChange={(e) => setManualPromo(e.target.value.toUpperCase())}
              placeholder="e.g. PILOT20-ABC123"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm font-mono uppercase"
            />
          </div>
        )}

        <ul className="mt-6 space-y-3 text-sm text-brand-800">
          {benefits.map((b) => (
            <li key={b} className="flex gap-3">
              <span className="font-semibold text-teal-700" aria-hidden>
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-brand-500">
          Billing continues until you cancel or record your practical test pass (Graduate Mode). Instructors and parents
          use Pass Pilot free forever.
        </p>
        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="conversion"
          disabled={busy}
          className="mt-6 min-h-[52px] w-full"
          onClick={() => void startCheckout()}
        >
          {busy ? "Opening checkout…" : `Subscribe · ${PRICING.subscription.display}/month`}
        </Button>
      </section>
    </div>
  );
}
