"use client";

import { useState } from "react";

import { Button } from "@/components/Button";
import { PRICING } from "@/lib/constants";

const benefits = [
  "Unlimited assessments",
  "Progress tracking",
  "AI-powered Premium reports",
  "Roadmap insights",
] as const;

export function SubscribeFlow() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/subscribe/success" }),
      });
      const json = (await res.json()) as { success?: boolean; url?: string; error?: { message?: string } };
      if (!json.success || !json.url) {
        setError(json.error?.message ?? "Could not start checkout.");
        return;
      }
      window.location.assign(json.url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-white to-brand-50/50 p-8 shadow-card ring-1 ring-teal-100">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">Learner subscription</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950">
          {PRICING.subscription.display}
          <span className="ml-2 text-lg font-medium text-brand-500">/ month</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-700">{PRICING.subscription.hint}</p>
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
          use Prep2Pass free forever.
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
