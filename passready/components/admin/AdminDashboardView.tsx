"use client";

import { useEffect, useState } from "react";

import { AdminPremiumInvitesPanel } from "@/components/admin/AdminPremiumInvitesPanel";
import { AdminPromoCodesPanel } from "@/components/admin/AdminPromoCodesPanel";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { Button } from "@/components/Button";

type Tab = "analytics" | "promos" | "invites";

const TABS: { id: Tab; label: string }[] = [
  { id: "analytics", label: "Analytics" },
  { id: "promos", label: "Promo codes" },
  { id: "invites", label: "Premium invites" },
];

export function AdminDashboardView() {
  const [key, setKey] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("analytics");

  useEffect(() => {
    const saved = sessionStorage.getItem("passready_admin_key");
    if (saved) {
      setKey(saved);
      setActiveKey(saved);
    }
  }, []);

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    sessionStorage.setItem("passready_admin_key", key.trim());
    setActiveKey(key.trim());
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onUnlock}
        className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]"
      >
        <label className="text-sm font-medium text-brand-900" htmlFor="admin-key">
          Admin access key
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            id="admin-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="block min-h-[48px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            placeholder="Enter ADMIN_ACCESS_KEY"
          />
          <Button type="submit" disabled={loading} className="w-full sm:w-auto sm:shrink-0">
            Unlock
          </Button>
        </div>
      </form>

      {activeKey ? (
        <>
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
          {tab === "promos" ? <AdminPromoCodesPanel adminKey={activeKey} /> : null}
          {tab === "invites" ? <AdminPremiumInvitesPanel adminKey={activeKey} /> : null}
        </>
      ) : null}
    </div>
  );
}
