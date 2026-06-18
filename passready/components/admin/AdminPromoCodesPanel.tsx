"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { ADMIN_PROMO_DISCOUNT_PERCENTS, formatDiscountLabel } from "@/lib/admin/promo-discounts";

type Promo = {
  id: string;
  code: string;
  label: string | null;
  discountPercent: number;
  active: boolean;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
  createdAt: string;
};

type Props = {
  adminKey: string;
};

export function AdminPromoCodesPanel({ adminKey }: Props) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [customCode, setCustomCode] = useState("");
  const [label, setLabel] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  async function loadPromos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        headers: { "x-admin-access-key": adminKey },
      });
      const json = (await res.json()) as { success?: boolean; promos?: Promo[]; error?: { message?: string } };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Could not load promo codes");
      setPromos(json.promos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load promo codes");
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPromos();
  }, [adminKey]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-access-key": adminKey,
        },
        body: JSON.stringify({
          discountPercent,
          ...(customCode.trim() ? { code: customCode.trim() } : {}),
          ...(label.trim() ? { label: label.trim() } : {}),
          ...(maxRedemptions.trim() ? { maxRedemptions: Number(maxRedemptions) } : {}),
          ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        }),
      });
      const json = (await res.json()) as { success?: boolean; promo?: Promo; error?: { message?: string } };
      if (!res.ok || !json.success || !json.promo) {
        throw new Error(json.error?.message ?? "Could not create promo code");
      }
      setMessage(`Created ${json.promo.code} (${formatDiscountLabel(json.promo.discountPercent)})`);
      setCustomCode("");
      setLabel("");
      setMaxRedemptions("");
      setExpiresAt("");
      await loadPromos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create promo code");
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
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Could not deactivate promo code");
      setMessage("Promo code deactivated.");
      await loadPromos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not deactivate promo code");
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
        <h2 className="text-lg font-semibold text-brand-950">Create promo code</h2>
        <p className="mt-1 text-sm text-brand-600">
          Generate Stripe-backed codes for 10%–100% off a premium learner subscription.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-code">
              Custom code (optional)
            </label>
            <input
              id="promo-code"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Auto-generated if blank"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm font-mono uppercase"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-label">
              Internal label (optional)
            </label>
            <input
              id="promo-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Summer campaign"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-max">
              Max redemptions (optional)
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
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-brand-900" htmlFor="promo-expires">
              Expires (optional)
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
          {busy ? "Creating…" : "Generate promo code"}
        </Button>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{message}</div>
      ) : null}

      <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]">
        <h2 className="text-lg font-semibold text-brand-950">Active promo codes</h2>
        {loading ? (
          <p className="mt-4 text-sm text-brand-600">Loading…</p>
        ) : promos.length === 0 ? (
          <p className="mt-4 text-sm text-brand-600">No promo codes yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-brand-500">
                <tr>
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Discount</th>
                  <th className="pb-2">Redemptions</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Expires</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 text-brand-800">
                {promos.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 font-mono text-xs">{p.code}</td>
                    <td className="py-2">{formatDiscountLabel(p.discountPercent)}</td>
                    <td className="py-2">
                      {p.timesRedeemed}
                      {p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ""}
                    </td>
                    <td className="py-2">{p.active ? "Active" : "Inactive"}</td>
                    <td className="py-2">{p.expiresAt ? new Date(p.expiresAt).toLocaleString("en-GB") : "—"}</td>
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
