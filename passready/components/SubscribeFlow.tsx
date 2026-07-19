"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { formatDiscountLabel } from "@/lib/admin/promo-discounts";
import { PREMIUM_SUBSCRIPTION_BENEFIT_GROUPS, PRICING } from "@/lib/constants";

type Props = {
  initialPromoCode?: string;
  initialPremiumInvite?: string;
  inviteDiscountPercent?: number | null;
};

export function SubscribeFlow({
  initialPromoCode = "",
  initialPremiumInvite = "",
  inviteDiscountPercent = null,
}: Props) {
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
  const [promoPreview, setPromoPreview] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function validatePromoCode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) {
      setPromoPreview(null);
      return;
    }
    setValidatingPromo(true);
    try {
      const res = await fetch("/api/subscription/validate-promo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: trimmed }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        promotion?: { summary: string; type: string; trialDays?: number | null };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.promotion) {
        setPromoPreview(null);
        setError(json.error?.message ?? "Promotion code is not valid.");
        return;
      }
      setError(null);
      setPromoPreview(`${json.promotion.summary} will be applied at checkout.`);
    } catch {
      setPromoPreview(null);
    } finally {
      setValidatingPromo(false);
    }
  }

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
  const discountLabel =
    inviteDiscountPercent != null ? formatDiscountLabel(inviteDiscountPercent) : "your invite discount";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-white to-brand-50/50 p-6 shadow-card ring-1 ring-teal-100 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
          {hasInvite ? "Premium invite" : "Premium"}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950">
          {hasInvite ? `Claim ${discountLabel} Premium` : PRICING.subscription.display}
          {!hasInvite ? <span className="ml-2 text-lg font-medium text-brand-500">/ month</span> : null}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-700">
          {hasInvite
            ? `Your invite discount is ready. Confirm in checkout — no free-trial step, just your ${discountLabel} Premium.`
            : PRICING.subscription.trialMessage}
        </p>
        {!hasInvite ? (
          <p className="mt-2 text-xs leading-relaxed text-brand-600">
            {PRICING.subscription.trialDays}-day free trial by default, then {PRICING.subscription.display}/month until
            you pass or cancel. Trial extension codes can give you longer. Graduate Mode stops billing when you pass.
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
            {discountLabel} is applied automatically for the invited email.
          </p>
        )}

        {!hasInvite ? (
          <div className="mt-4">
            <label className="text-sm font-medium text-brand-900" htmlFor="subscribe-promo">
              Promotion code (optional)
            </label>
            <input
              id="subscribe-promo"
              value={manualPromo}
              onChange={(e) => {
                setManualPromo(e.target.value.toUpperCase());
                setPromoPreview(null);
              }}
              onBlur={() => void validatePromoCode(manualPromo)}
              placeholder="e.g. PILOT20-ABC123 or TRIAL21-ABC123"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 font-mono text-sm uppercase"
            />
            {validatingPromo ? (
              <p className="mt-2 text-xs text-brand-500">Checking code…</p>
            ) : promoPreview ? (
              <p className="mt-2 text-xs text-teal-800">{promoPreview}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-brand-950">Everything included with Premium</h2>
          <div className="mt-4 space-y-5">
            {PREMIUM_SUBSCRIPTION_BENEFIT_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{group.title}</p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-brand-800">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-brand-500">
          Instructors and parent supervisors use Pass Pilot free. Learner billing continues until you cancel or record
          your practical test pass.
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
          {busy ? "Opening checkout…" : hasInvite ? "Claim Premium discount" : PRICING.subscription.trialCta}
        </Button>
      </section>
    </div>
  );
}
