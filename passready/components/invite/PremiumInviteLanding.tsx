"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { formatDiscountLabel } from "@/lib/admin/promo-discounts";

type InviteDetails = {
  pupilEmail: string;
  discountPercent: number;
  discountLabel: string;
  promoCode: string | null;
  status: "pending" | "redeemed" | "expired" | "revoked";
  expiresAt: string;
};

type Props = {
  token: string;
};

export function PremiumInviteLanding({ token }: Props) {
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/invite/premium/${encodeURIComponent(token)}`);
        const json = (await res.json()) as {
          success?: boolean;
          invite?: InviteDetails;
          error?: { message?: string };
        };
        if (!res.ok || !json.success || !json.invite) {
          throw new Error(json.error?.message ?? "Invite not found");
        }
        setInvite(json.invite);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invite not found");
        setInvite(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token]);

  const isFullGift = Boolean(invite && invite.discountPercent >= 100);

  const postAuthNext = useMemo(() => {
    if (!invite) return "/dashboard";
    if (invite.discountPercent >= 100) {
      return `/invite/premium/${encodeURIComponent(token)}/claim`;
    }
    return `/subscribe?premiumInvite=${encodeURIComponent(token)}`;
  }, [invite, token]);

  const signupHref = useMemo(() => {
    if (!invite) return "/signup";
    const q = new URLSearchParams({
      next: postAuthNext,
      email: invite.pupilEmail,
      premiumInvite: token,
    });
    return `/signup?${q.toString()}`;
  }, [invite, postAuthNext, token]);

  const loginHref = useMemo(() => {
    const q = new URLSearchParams({ next: postAuthNext });
    return `/login?${q.toString()}`;
  }, [postAuthNext]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600 shadow-card">
        Loading your invite…
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-card">
        <h1 className="font-heading text-2xl font-semibold text-red-950">Invite unavailable</h1>
        <p className="mt-3 text-sm text-red-900">{error ?? "This invite link is not valid."}</p>
        <Button href="/welcome" variant="secondary" className="mt-6">
          Back to welcome
        </Button>
      </div>
    );
  }

  const isUsable = invite.status === "pending";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-white to-brand-50/50 p-8 shadow-card ring-1 ring-teal-100">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">Premium invite</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950">
          {isFullGift ? "Your free Premium access" : `${formatDiscountLabel(invite.discountPercent)} Pass Pilot Premium`}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-700">
          {isFullGift
            ? "Create your account with the invited email, verify once, and Premium unlocks automatically — no payment step."
            : `You've been invited to Premium with ${invite.discountLabel}. Create your account, then claim your discount in one short checkout.`}
        </p>
        <div className="mt-5 rounded-xl border border-brand-200 bg-white/80 px-4 py-3 text-sm text-brand-800">
          <p>
            <span className="font-medium text-brand-950">Use this email:</span> {invite.pupilEmail}
          </p>
          <p className="mt-1 text-xs text-brand-500">
            Valid until {new Date(invite.expiresAt).toLocaleString("en-GB")}
          </p>
        </div>

        {!isUsable ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This invite is {invite.status}. Contact support if you think this is a mistake.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            <Button href={signupHref} variant="conversion" className="min-h-[52px] w-full">
              {isFullGift ? "Create account & activate" : "Create account & claim"}
            </Button>
            <p className="text-center text-sm text-brand-600">
              Already have an account?{" "}
              <Link href={loginHref} className="font-semibold text-teal-800 underline-offset-4 hover:underline">
                {isFullGift ? "Sign in to activate" : "Sign in to claim"}
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
