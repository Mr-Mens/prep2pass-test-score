"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminAccountsPanel } from "@/components/admin/AdminAccountsPanel";
import { AdminPayoutRequestsPanel } from "@/components/admin/AdminPayoutRequestsPanel";
import { AdminPremiumInvitesPanel } from "@/components/admin/AdminPremiumInvitesPanel";
import { AdminPromotionsPanel } from "@/components/admin/AdminPromotionsPanel";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/Button";
import { ADMIN_SESSION_KEY, validateAdminAccessKey } from "@/lib/admin/session";

type Tab = "analytics" | "promos" | "invites" | "payouts" | "accounts";

const TABS: { id: Tab; label: string }[] = [
  { id: "analytics", label: "Analytics" },
  { id: "accounts", label: "Accounts" },
  { id: "promos", label: "Promotions" },
  { id: "invites", label: "Premium invites" },
  { id: "payouts", label: "Payout requests" },
];

export function AdminDashboardView() {
  const [key, setKey] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("analytics");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const saved = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!saved) {
        if (!cancelled) setBootstrapping(false);
        return;
      }

      const result = await validateAdminAccessKey(saved);
      if (cancelled) return;

      if (result.ok) {
        setKey(saved);
        setActiveKey(saved);
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }

      setBootstrapping(false);
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;

    setLoading(true);
    setAuthError(null);

    const result = await validateAdminAccessKey(trimmed);
    if (!result.ok) {
      setAuthError(result.message);
      setLoading(false);
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, trimmed);
    setActiveKey(trimmed);
    setLoading(false);
  }

  function onSignOut() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setActiveKey(null);
    setKey("");
    setAuthError(null);
    setTab("analytics");
  }

  if (bootstrapping) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-brand-600">Checking admin access…</p>
      </div>
    );
  }

  if (!activeKey) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="inline-flex justify-center" aria-label="Pass Pilot home">
              <BrandLogo variant="auth" />
            </Link>
            <h1 className="mt-6 font-heading text-2xl font-semibold text-brand-950">Admin access</h1>
            <p className="mt-2 text-sm text-brand-600">
              Enter your admin access key to manage accounts, promotions, invites, and analytics.
            </p>
          </div>

          <form
            onSubmit={onUnlock}
            className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]"
          >
            <label className="text-sm font-medium text-brand-900" htmlFor="admin-key">
              Admin access key
            </label>
            <div className="mt-2 space-y-3">
              <input
                id="admin-key"
                type="password"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  if (authError) setAuthError(null);
                }}
                autoComplete="off"
                className="block min-h-[48px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                placeholder="Enter admin access key"
              />
              {authError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {authError}
                </div>
              ) : null}
              <Button type="submit" disabled={loading || !key.trim()} className="w-full">
                {loading ? "Checking…" : "Unlock admin"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-brand-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Internal admin</p>
            <h1 className="truncate font-heading text-xl font-semibold text-brand-950 sm:text-2xl">
              Pass Pilot admin
            </h1>
          </div>
          <Button type="button" variant="secondary" onClick={onSignOut} className="shrink-0">
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-brand-900 text-white"
                  : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "analytics" ? <AdminAnalyticsPanel adminKey={activeKey} onLoadingChange={setLoading} /> : null}
        {tab === "accounts" ? <AdminAccountsPanel adminKey={activeKey} /> : null}
        {tab === "promos" ? <AdminPromotionsPanel adminKey={activeKey} /> : null}
        {tab === "invites" ? <AdminPremiumInvitesPanel adminKey={activeKey} /> : null}
        {tab === "payouts" ? <AdminPayoutRequestsPanel adminKey={activeKey} /> : null}
      </main>
    </div>
  );
}
