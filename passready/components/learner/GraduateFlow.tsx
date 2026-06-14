"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";
import { BRAND_CTA, PREMIUM_MEMBER_UI } from "@/lib/constants";

type Props = {
  isGraduated?: boolean;
  passDate?: string | null;
};

export function GraduateFlow({ isGraduated = false, passDate = null }: Props) {
  const router = useRouter();
  const [passDateInput, setPassDateInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isGraduated) {
    return (
      <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50/60 p-8 text-center shadow-card ring-1 ring-teal-100">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">Graduate mode</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          Congratulations!
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-brand-700">
          You passed on{" "}
          <span className="font-semibold text-brand-950">
            {passDate
              ? new Date(`${passDate}T12:00:00`).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "your test date"}
          </span>
          . Your account, reports, and progress history stay available. New Test Ready Scores and billing are disabled.
        </p>
        <p className="mt-3 text-sm text-teal-800">{PREMIUM_MEMBER_UI.graduateBadge}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href="/my-reports" variant="conversion" className="min-h-[48px]">
            {BRAND_CTA.viewScoreHistory}
          </Button>
          <Button href="/dashboard" variant="secondary" className="min-h-[48px]">
            Back to dashboard
          </Button>
        </div>
      </section>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passDateInput) {
      setError("Enter your practical test pass date.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/learner/graduate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passDate: passDateInput }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!json.success) {
        setError(json.error?.message ?? "Could not record your pass.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-card sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Graduate mode</p>
      <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
        Record your pass
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-700">
        Passed your practical test? Record your pass date to stop future billing while keeping your account and saved
        reports. New Test Ready Scores will be disabled.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 max-w-md space-y-5">
        <div>
          <label htmlFor="pass-date" className="text-sm font-medium text-brand-900">
            Pass date
          </label>
          <input
            id="pass-date"
            type="date"
            value={passDateInput}
            onChange={(e) => setPassDateInput(e.target.value)}
            className="mt-2 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm text-brand-950 shadow-sm"
            required
          />
        </div>
        <p className="text-xs leading-relaxed text-brand-500">
          Optional certificate upload will be added in a later release. Your pass date is enough to activate Graduate
          Mode.
        </p>
        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="conversion" disabled={busy} className="min-h-[48px] w-full sm:w-auto">
          {busy ? "Saving…" : "Activate Graduate Mode"}
        </Button>
      </form>
    </section>
  );
}
