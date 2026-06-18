"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/Button";

type Overview = {
  totalReports: number;
  totalPaidSessions: number;
  totalRevenue: number;
  aiReportCount: number;
  fallbackReportCount: number;
  conversionProxyRate: number | null;
  averageReadinessScore: number | null;
  reportsLast7Days: number;
  revenueLast30Days: number;
};

type Sale = {
  created_at: string;
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  customer_email: string | null;
  stripe_session_id: string;
};

type Props = {
  adminKey: string;
  onLoadingChange?: (loading: boolean) => void;
};

function poundsFromMinor(amount: number | null) {
  if (amount == null) return "N/A";
  return `£${(amount / 100).toFixed(2)}`;
}

export function AdminAnalyticsPanel({ adminKey, onLoadingChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  async function loadAnalytics() {
    setLoading(true);
    onLoadingChange?.(true);
    setError(null);
    try {
      const headers = { "x-admin-access-key": adminKey };
      const [oRes, sRes] = await Promise.all([
        fetch("/api/admin/analytics/overview", { headers }),
        fetch("/api/admin/analytics/recent-sales", { headers }),
      ]);
      const oRaw = await oRes.json();
      const sRaw = await sRes.json();
      if (!oRes.ok || !sRes.ok) {
        const msg = oRaw?.error?.message ?? sRaw?.error?.message ?? "Unable to load analytics";
        throw new Error(msg);
      }
      setOverview(oRaw);
      setSales(sRaw.sales ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load analytics");
      setOverview(null);
      setSales([]);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, [adminKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-brand-950">Analytics overview</h2>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void loadAnalytics()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div> : null}

      {overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Total reports", v: overview.totalReports },
              { k: "Paid sessions", v: overview.totalPaidSessions },
              { k: "Total revenue", v: poundsFromMinor(overview.totalRevenue) },
              { k: "Revenue (30d)", v: poundsFromMinor(overview.revenueLast30Days) },
              { k: "AI reports", v: overview.aiReportCount },
              { k: "Fallback reports", v: overview.fallbackReportCount },
              { k: "Avg readiness", v: overview.averageReadinessScore ?? "N/A" },
              { k: "Reports (7d)", v: overview.reportsLast7Days },
            ].map((item) => (
              <div
                key={item.k}
                className="rounded-xl border border-brand-200/70 bg-white p-4 shadow-sm ring-1 ring-black/[0.02]"
              >
                <p className="text-xs uppercase tracking-wide text-brand-500">{item.k}</p>
                <p className="mt-2 text-xl font-semibold text-brand-950">{item.v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]">
            <h3 className="text-lg font-semibold text-brand-950">Recent sales</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-brand-500">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100 text-brand-800">
                  {sales.map((s) => (
                    <tr key={s.stripe_session_id}>
                      <td className="py-2">{new Date(s.created_at).toLocaleString("en-GB")}</td>
                      <td className="py-2">{poundsFromMinor(s.amount_total)}</td>
                      <td className="py-2">{s.payment_status}</td>
                      <td className="py-2">{s.customer_email ?? "N/A"}</td>
                      <td className="py-2 font-mono text-xs">{s.stripe_session_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : loading ? (
        <p className="text-sm text-brand-600">Loading analytics…</p>
      ) : null}
    </div>
  );
}
