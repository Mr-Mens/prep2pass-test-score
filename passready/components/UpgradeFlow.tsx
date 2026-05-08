"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { requestUpgradeCheckout } from "@/lib/api/upgrade-to-lifetime";
import { PRICING } from "@/lib/constants";
import { ApiRequestError } from "@/lib/errors";
import { loadPersistedRecord } from "@/lib/storage";

type Status = "ready" | "submitting" | "error";

const fieldClass =
  "mt-1 block min-h-[50px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3.5 text-sm text-brand-950 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200";
const labelClass = "text-sm font-medium text-brand-900";

export function UpgradeFlow() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const record = loadPersistedRecord();
    if (!record) return;
    if (record.version === 2) {
      setFullName(record.assessment.fullName ?? "");
      setEmail(record.assessment.email ?? "");
    } else if (record.version === 1) {
      setFullName(record.data.fullName ?? "");
      setEmail(record.data.email ?? "");
    }
  }, []);

  const valid = useMemo(() => {
    if (!fullName.trim() || fullName.trim().length < 2) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false;
    return true;
  }, [fullName, email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await requestUpgradeCheckout({ fullName: fullName.trim(), email: email.trim() });
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
    <div className="rounded-2xl border-2 border-teal-300/80 bg-gradient-to-br from-teal-50/95 via-white to-brand-50/60 p-5 shadow-card ring-1 ring-teal-600/[0.07] sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Lifetime upgrade</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
        Unlock unlimited TestReady reports
      </h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-brand-700">
        One payment of {PRICING.lifetime.display} adds lifetime access to your email. Generate fresh Premium reports
        whenever you retake the assessment, plus the progress timeline on your results page.
      </p>

      <ul className="mt-5 space-y-2 text-sm leading-relaxed text-brand-800">
        {[
          "Unlimited Premium TestReady reports",
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
        <div>
          <label className={labelClass} htmlFor="upgrade-name">
            Full name
          </label>
          <input
            id="upgrade-name"
            className={fieldClass}
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="upgrade-email">
            Email
          </label>
          <input
            id="upgrade-email"
            type="email"
            className={fieldClass}
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="mt-1 text-xs leading-relaxed text-brand-500">
            Lifetime access is granted to this email. Use the same email you used for your report.
          </p>
        </div>

        {errorMessage ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          <Button
            type="submit"
            variant="conversion"
            disabled={!valid || status === "submitting"}
            className="w-full min-h-[52px] sm:w-auto sm:min-w-[18rem]"
          >
            {status === "submitting" ? "Starting checkout..." : `Pay ${PRICING.lifetime.display} and unlock`}
          </Button>
          <Button href="/results" variant="ghost" className="w-full min-h-[48px] sm:w-auto">
            Back to my report
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-brand-500">
          Secure payment powered by Stripe. No subscription. No hidden charges.
        </p>
      </form>
    </div>
  );
}
