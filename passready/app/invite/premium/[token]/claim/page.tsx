import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/Button";
import {
  premiumInviteClaimPath,
  premiumInviteSubscribePath,
  redeemPremiumInviteForUser,
} from "@/lib/server/redeem-premium-invite";
import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";

export const metadata: Metadata = {
  title: "Activate Premium · Pass Pilot",
  description: "Activate your Pass Pilot Premium invite.",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function PremiumInviteClaimPage({ params }: PageProps) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken).trim();
  const claimPath = premiumInviteClaimPath(token);

  const user = await requireAuthenticatedSession(claimPath);
  if (!user.email) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="font-heading text-xl font-semibold text-red-950">Email required</h1>
        <p className="mt-3 text-sm text-red-900">Your account needs a verified email to claim this invite.</p>
        <Button href="/account" variant="secondary" className="mt-6">
          Open account
        </Button>
      </div>
    );
  }

  const result = await redeemPremiumInviteForUser({
    token,
    userId: user.id,
    email: user.email,
  });

  if (result.ok) {
    redirect(result.kind === "already_premium" ? "/dashboard" : "/dashboard?premium=gift");
  }

  if (result.kind === "needs_checkout") {
    redirect(premiumInviteSubscribePath(token));
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm">
      <h1 className="font-heading text-2xl font-semibold text-brand-950">Could not activate invite</h1>
      <p className="text-sm leading-relaxed text-brand-700">{result.message}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button href={`/invite/premium/${encodeURIComponent(token)}`} variant="secondary">
          Back to invite
        </Button>
        <Button href="/dashboard" variant="conversion">
          Go to dashboard
        </Button>
      </div>
      <p className="text-xs text-brand-500">
        Wrong account?{" "}
        <Link href="/login" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
          Sign in with the invited email
        </Link>
      </p>
    </div>
  );
}
