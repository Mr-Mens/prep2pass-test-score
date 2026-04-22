"use client";

import { useState } from "react";

import { Button } from "@/components/Button";

export function ReportLookupForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function requestLink() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const raw = (await res.json()) as
        | { success: true }
        | { success: false; error?: { message?: string } };

      if (!res.ok || !raw.success) {
        setError(raw.success ? "Request failed" : raw.error?.message ?? "Request failed");
        return;
      }
      setSent(true);
    } catch {
      setError("Unable to request access right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(false);
    await requestLink();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]"
      >
        <label className="text-sm font-medium text-brand-900" htmlFor="lookup-email">
          Email used at checkout
        </label>
        <input
          id="lookup-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 block min-h-[48px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          placeholder="you@example.com"
        />
        <p className="mt-3 text-xs leading-relaxed text-brand-500/90">
          We will email you a secure link to open your reports.
        </p>
        <div className="mt-5">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Sending link..." : "Email Me Access Link"}
          </Button>
        </div>
      </form>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div> : null}
      {sent ? (
        <div className="rounded-xl border border-teal-200/80 bg-teal-50/80 px-4 py-3 text-sm text-teal-900">
          <p>Check your email. We’ve sent you a secure link to access your report.</p>
          <div className="mt-3">
            <Button type="button" variant="secondary" disabled={loading} onClick={requestLink} className="w-full sm:w-auto">
              {loading ? "Sending..." : "Resend link"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
