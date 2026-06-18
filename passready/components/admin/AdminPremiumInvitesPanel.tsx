"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { ADMIN_PROMO_DISCOUNT_PERCENTS, formatDiscountLabel } from "@/lib/admin/promo-discounts";

type PromoOption = {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
};

type Invite = {
  id: string;
  token: string;
  pupilEmail: string;
  discountPercent: number;
  promoCode: string | null;
  status: string;
  expiresAt: string;
  redeemedAt: string | null;
  note: string | null;
  createdAt: string;
  inviteUrl: string;
};

type Props = {
  adminKey: string;
};

export function AdminPremiumInvitesPanel({ adminKey }: Props) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [promos, setPromos] = useState<PromoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [pupilEmail, setPupilEmail] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(100);
  const [promoCodeId, setPromoCodeId] = useState("");
  const [note, setNote] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const headers = { "x-admin-access-key": adminKey };
      const [invRes, promoRes] = await Promise.all([
        fetch("/api/admin/premium-invites", { headers }),
        fetch("/api/admin/promo-codes", { headers }),
      ]);
      const invJson = (await invRes.json()) as {
        success?: boolean;
        invites?: Invite[];
        error?: { message?: string };
      };
       const promoJson = (await promoRes.json()) as {
        success?: boolean;
        promos?: Array<{ id: string; code: string; discountPercent: number; active: boolean }>;
        error?: { message?: string };
      };
      if (!invRes.ok || !invJson.success) throw new Error(invJson.error?.message ?? "Could not load invites");
      if (!promoRes.ok || !promoJson.success) throw new Error(promoJson.error?.message ?? "Could not load promo codes");
      setInvites(invJson.invites ?? []);
      setPromos(
        (promoJson.promos ?? [])
          .filter((p) => p.active)
          .map((p) => ({
            id: p.id,
            code: p.code,
            discountPercent: p.discountPercent,
            active: p.active,
          })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data");
      setInvites([]);
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [adminKey]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/premium-invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-access-key": adminKey,
        },
        body: JSON.stringify({
          pupilEmail: pupilEmail.trim(),
          discountPercent,
          ...(promoCodeId ? { promoCodeId } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
          expiresInDays: Number(expiresInDays) || 30,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        invite?: Invite;
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.invite) {
        throw new Error(json.error?.message ?? "Could not create invite");
      }
      setMessage(`Invite link created for ${json.invite.pupilEmail}`);
      setPupilEmail("");
      setNote("");
      setPromoCodeId("");
      await loadData();
      await copyText(json.invite.inviteUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create invite");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`Copied invite link`);
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
        <h2 className="text-lg font-semibold text-brand-950">Create premium invite link</h2>
        <p className="mt-1 text-sm text-brand-600">
          Generate a personal link for a pupil email. They sign up with that address and subscribe with the discount applied.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-brand-900" htmlFor="invite-email">
              Pupil email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={pupilEmail}
              onChange={(e) => setPupilEmail(e.target.value)}
              placeholder="pupil@example.com"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="invite-discount">
              Discount
            </label>
            <select
              id="invite-discount"
              value={discountPercent}
              onChange={(e) => {
                setDiscountPercent(Number(e.target.value));
                setPromoCodeId("");
              }}
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
            <label className="text-sm font-medium text-brand-900" htmlFor="invite-promo">
              Use existing promo (optional)
            </label>
            <select
              id="invite-promo"
              value={promoCodeId}
              onChange={(e) => {
                const next = e.target.value;
                setPromoCodeId(next);
                const match = promos.find((p) => p.id === next);
                if (match) setDiscountPercent(match.discountPercent);
              }}
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm"
            >
              <option value="">Auto-create single-use code</option>
              {promos
                .filter((p) => p.discountPercent === discountPercent)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="invite-expires">
              Link valid (days)
            </label>
            <input
              id="invite-expires"
              type="number"
              min={1}
              max={365}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="invite-note">
              Internal note (optional)
            </label>
            <input
              id="invite-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            />
          </div>
        </div>
        <Button type="submit" disabled={busy} className="mt-5">
          {busy ? "Creating…" : "Generate invite link"}
        </Button>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{message}</div>
      ) : null}

      <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]">
        <h2 className="text-lg font-semibold text-brand-950">Premium invite links</h2>
        {loading ? (
          <p className="mt-4 text-sm text-brand-600">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="mt-4 text-sm text-brand-600">No invites yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-brand-500">
                <tr>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Discount</th>
                  <th className="pb-2">Promo</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Expires</th>
                  <th className="pb-2">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 text-brand-800">
                {invites.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2">{i.pupilEmail}</td>
                    <td className="py-2">{formatDiscountLabel(i.discountPercent)}</td>
                    <td className="py-2 font-mono text-xs">{i.promoCode ?? "—"}</td>
                    <td className="py-2 capitalize">{i.status}</td>
                    <td className="py-2">{new Date(i.expiresAt).toLocaleString("en-GB")}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => void copyText(i.inviteUrl)}
                        className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-800 hover:bg-brand-50"
                      >
                        Copy link
                      </button>
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
