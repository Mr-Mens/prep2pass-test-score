"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/Button";
import {
  ADMIN_PROMO_DISCOUNT_PERCENTS,
  formatDiscountLabel,
  formatPromotionTypeLabel,
  formatTrialDaysLabel,
  TRIAL_EXTENSION_PRESETS,
  type AdminPromotionType,
} from "@/lib/admin/promotions";

type PromotionAnalytics = {
  timesRedeemed: number;
  activeUsers: number;
  trialConversions: number;
  discountConversions: number;
};

type Promotion = {
  id: string;
  code: string;
  promotionType: AdminPromotionType;
  discountPercent: number | null;
  trialDays: number | null;
  campaignName: string | null;
  notes: string | null;
  active: boolean;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
  createdAt: string;
  summary: string;
  typeLabel: string;
  analytics?: PromotionAnalytics;
};

type Filter = "all" | AdminPromotionType;

type Props = {
  adminKey: string;
};

export function AdminPromotionsPanel({ adminKey }: Props) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const [promotionType, setPromotionType] = useState<AdminPromotionType>("discount");
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [trialPreset, setTrialPreset] = useState<number>(14);
  const [customTrialDays, setCustomTrialDays] = useState("");
  const [useCustomTrial, setUseCustomTrial] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [notes, setNotes] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const resolvedTrialDays = useMemo(() => {
    if (!useCustomTrial) return trialPreset;
    const parsed = Number(customTrialDays);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 365 ? Math.floor(parsed) : null;
  }, [customTrialDays, trialPreset, useCustomTrial]);

  async function loadPromotions() {
    setLoading(true);
    setError(null);
    try {
      const query = filter === "all" ? "" : `?type=${filter}`;
      const res = await fetch(`/api/admin/promo-codes${query}`, {
        headers: { "x-admin-access-key": adminKey },
      });
      const json = (await res.json()) as {
        success?: boolean;
        promos?: Promotion[];
        migrationRequired?: boolean;
        hint?: string;
        error?: { message?: string };
      };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Could not load promotions");
      setPromotions(json.promos ?? []);
      if (json.migrationRequired && json.hint) setMessage(json.hint);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load promotions");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPromotions();
  }, [adminKey, filter]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (promotionType === "trial_extension" && resolvedTrialDays == null) {
      setError("Enter a custom trial length between 1 and 365 days.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload =
        promotionType === "discount"
          ? {
              promotionType: "discount" as const,
              discountPercent,
              ...(customCode.trim() ? { code: customCode.trim() } : {}),
              ...(campaignName.trim() ? { campaignName: campaignName.trim() } : {}),
              ...(notes.trim() ? { notes: notes.trim() } : {}),
              ...(maxRedemptions.trim() ? { maxRedemptions: Number(maxRedemptions) } : {}),
              ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
            }
          : {
              promotionType: "trial_extension" as const,
              trialDays: resolvedTrialDays!,
              ...(customCode.trim() ? { code: customCode.trim() } : {}),
              ...(campaignName.trim() ? { campaignName: campaignName.trim() } : {}),
              ...(notes.trim() ? { notes: notes.trim() } : {}),
              ...(maxRedemptions.trim() ? { maxRedemptions: Number(maxRedemptions) } : {}),
              ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
            };

      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-access-key": adminKey,
        },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { success?: boolean; promo?: Promotion; error?: { message?: string } };
      if (!res.ok || !json.success || !json.promo) {
        throw new Error(json.error?.message ?? "Could not create promotion");
      }
      setMessage(`Created ${json.promo.code} (${json.promo.summary})`);
      setCustomCode("");
      setCampaignName("");
      setNotes("");
      setMaxRedemptions("");
      setExpiresAt("");
      setCustomTrialDays("");
      setUseCustomTrial(false);
      await loadPromotions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create promotion");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(id: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-access-key": adminKey,
        },
        body: JSON.stringify({ id, active: false }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Could not deactivate promotion");
      setMessage("Promotion deactivated.");
      await loadPromotions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not deactivate promotion");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`Copied ${code}`);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => void onCreate(e)}
        className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]"
      >
        <h2 className="text-lg font-semibold text-brand-950">Create promotion</h2>
        <p className="mt-1 text-sm text-brand-600">
          Percentage discounts use Stripe coupons. Trial extensions extend the Premium trial without a Stripe coupon.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="text-sm font-medium text-brand-900">Promotion type</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["discount", "trial_extension"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPromotionType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    promotionType === type
                      ? "bg-brand-900 text-white"
                      : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                  }`}
                >
                  {type === "discount" ? "Discount" : "Trial extension"}
                </button>
              ))}
            </div>
          </div>

          {promotionType === "discount" ? (
            <div>
              <label className="text-sm font-medium text-brand-900" htmlFor="promo-discount">
                Discount
              </label>
              <select
                id="promo-discount"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm"
              >
                {ADMIN_PROMO_DISCOUNT_PERCENTS.map((p) => (
                  <option key={p} value={p}>
                    {formatDiscountLabel(p)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <span className="text-sm font-medium text-brand-900">Trial length</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRIAL_EXTENSION_PRESETS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setUseCustomTrial(false);
                      setTrialPreset(days);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      !useCustomTrial && trialPreset === days
                        ? "bg-teal-700 text-white"
                        : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                    }`}
                  >
                    {formatTrialDaysLabel(days)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustomTrial(true)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    useCustomTrial
                      ? "bg-teal-700 text-white"
                      : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                  }`}
                >
                  Custom
                </button>
              </div>
              {useCustomTrial ? (
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customTrialDays}
                  onChange={(e) => setCustomTrialDays(e.target.value)}
                  placeholder="Days (1-365)"
                  className="mt-3 block min-h-[48px] w-full max-w-xs rounded-xl border border-brand-200 px-4 py-3 text-sm"
                />
              ) : null}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-code">
              Code (optional)
            </label>
            <input
              id="promo-code"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Auto-generated if blank"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 font-mono text-sm uppercase"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-campaign">
              Campaign name (optional)
            </label>
            <input
              id="promo-campaign"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Summer campaign"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-notes">
              Notes (optional)
            </label>
            <textarea
              id="promo-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes for this campaign"
              className="mt-1 block w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-max">
              Maximum uses (optional)
            </label>
            <input
              id="promo-max"
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-expires">
              Expiry date (optional)
            </label>
            <input
              id="promo-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            />
          </div>
        </div>
        <Button type="submit" disabled={busy} className="mt-5">
          {busy ? "Creating…" : "Create promotion"}
        </Button>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{message}</div>
      ) : null}

      <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-950">Promotions</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "all", label: "All" },
                { id: "discount", label: "Discount" },
                { id: "trial_extension", label: "Trial extension" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === item.id
                    ? "bg-brand-900 text-white"
                    : "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-brand-600">Loading…</p>
        ) : promotions.length === 0 ? (
          <p className="mt-4 text-sm text-brand-600">No promotions yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-brand-500">
                <tr>
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Offer</th>
                  <th className="pb-2">Campaign</th>
                  <th className="pb-2">Redeemed</th>
                  <th className="pb-2">Active users</th>
                  <th className="pb-2">Conversions</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Expires</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 text-brand-800">
                {promotions.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 font-mono text-xs">{p.code}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          p.promotionType === "discount"
                            ? "bg-violet-50 text-violet-900 ring-1 ring-violet-200"
                            : "bg-teal-50 text-teal-900 ring-1 ring-teal-200"
                        }`}
                      >
                        {formatPromotionTypeLabel(p.promotionType)}
                      </span>
                    </td>
                    <td className="py-2">{p.summary}</td>
                    <td className="py-2 max-w-[10rem] truncate">{p.campaignName ?? "-"}</td>
                    <td className="py-2">
                      {p.analytics?.timesRedeemed ?? p.timesRedeemed}
                      {p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ""}
                    </td>
                    <td className="py-2">{p.analytics?.activeUsers ?? 0}</td>
                    <td className="py-2">
                      {p.promotionType === "trial_extension"
                        ? p.analytics?.trialConversions ?? 0
                        : p.analytics?.discountConversions ?? 0}
                    </td>
                    <td className="py-2">{p.active ? "Active" : "Inactive"}</td>
                    <td className="py-2">{p.expiresAt ? new Date(p.expiresAt).toLocaleString("en-GB") : "-"}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void copyCode(p.code)}
                          className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-800 hover:bg-brand-50"
                        >
                          Copy
                        </button>
                        {p.active ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void deactivate(p.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use AdminPromotionsPanel */
export const AdminPromoCodesPanel = AdminPromotionsPanel;
