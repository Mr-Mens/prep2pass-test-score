"use client";

import { useState } from "react";

import { Button } from "@/components/Button";

type ReportSummary = {
  id: string;
  created_at: string;
  readiness_score: number;
  readiness_label: string;
  report_source: string;
};

export function ReportLookupForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportSummary[] | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReports(null);
    try {
      const res = await fetch("/api/reports/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const raw = (await res.json()) as
        | { success: true; reports: ReportSummary[] }
        | { success: false; error?: { message?: string } };

      if (!res.ok || !raw.success) {
        setError(raw.success ? "Lookup failed" : raw.error?.message ?? "Lookup failed");
        return;
      }
      setReports(raw.reports);
    } catch {
      setError("Unable to look up reports right now. Please try again.");
    } finally {
      setLoading(false);
    }
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
          Lookup is email-only for now; sign-in will replace this later.
        </p>
        <div className="mt-5">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Searching…" : "Find My Report"}
          </Button>
        </div>
      </form>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div> : null}

      {reports ? (
        reports.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card">
            <ul className="divide-y divide-brand-100">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-950">
                      {new Date(r.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-brand-600">
                      Score {r.readiness_score} · {r.readiness_label} · {r.report_source}
                    </p>
                  </div>
                  <Button href={`/reports/${r.id}`} variant="secondary" className="w-full min-h-[48px] text-sm sm:w-auto sm:shrink-0">
                    Open report
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-700">
            No reports found for that email yet.
          </div>
        )
      ) : null}
    </div>
  );
}
