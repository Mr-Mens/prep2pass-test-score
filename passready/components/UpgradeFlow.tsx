"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { requestUpgradeCheckout } from "@/lib/api/upgrade-to-lifetime";
import { PRICING, SMART_UI } from "@/lib/constants";
import { ApiRequestError } from "@/lib/errors";

type Account = { email: string } | null;

type Status = "ready" | "submitting" | "error";

export function UpgradeFlow() {
  const router = useRouter();
  const [account, setAccount] = useState<Account>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const raw = (await res.json()) as { user?: { email?: string } | null };
        if (!cancelled && raw.user?.email) {
          setAccount({ email: raw.user.email });
        }
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await requestUpgradeCheckout();
      if (res.alreadyHasLifetime) {
        router.replace("/results?upgrade=already");
        return;
      }
      window.location.assign(res.url);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Could not start upgrade. Try again.";
      setErrorMessage(message);
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-teal-200/75 bg-teal-50/40 p-5 shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Lifetime upgrade</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
        Unlock unlimited {SMART_UI.reports.toLowerCase()}
      </h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-brand-700">
        One payment of {PRICING.lifetime.display} adds lifetime access to your Pass Pilot account. Generate fresh Premium
        reports whenever you retake the assessment, plus the progress timeline on your results page.
      </p>

      {account ? (
        <p className="mt-4 rounded-xl border border-brand-100 bg-white/80 px-4 py-3 text-sm text-brand-800">
          Signed in as <span className="font-semibold">{account.email}</span>
        </p>
      ) : (
        <p className="mt-4 text-sm text-brand-600">Loading your account details…</p>
      )}

      <ul className="mt-5 space-y-2 text-sm leading-relaxed text-brand-800">
        {[
          "Unlimited Premium Test Ready Score Reports",
          "Score history with date-stamped progress",
          "No subscription, no extra charges",
        ].map((line) => (
          <li key={line} className="flex gap-3">
            <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {errorMessage ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          <Button
            type="submit"
            variant="conversion"
            disabled={status === "submitting"}
            className="w-full min-h-[52px] sm:w-auto sm:min-w-[18rem]"
          >
            {status === "submitting" ? "Starting checkout..." : `Pay ${PRICING.lifetime.display} and unlock`}
          </Button>
          <Button href="/results" variant="ghost" className="w-full min-h-[48px] sm:w-auto">
            Back to my report
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-brand-500">
          Secure payment powered by Stripe. No subscription. Your reports stay linked to your Pass Pilot account.
        </p>
      </form>
    </div>
  );
}
