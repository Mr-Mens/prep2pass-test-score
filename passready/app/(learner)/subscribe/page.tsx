import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SubscribeFlow } from "@/components/SubscribeFlow";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import {
  premiumInviteClaimPath,
  premiumInviteSubscribePath,
} from "@/lib/server/redeem-premium-invite";
import {
  getAdminPremiumInviteByToken,
  resolvePremiumInviteStatus,
} from "@/lib/server/repositories/admin-promo-repository";
import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";
import { syncSubscriptionForUserFromStripe } from "@/lib/server/sync-user-subscription-from-stripe";

export const metadata: Metadata = {
  title: "Start Premium · Pass Pilot",
  description:
    "Unlock unlimited Test Ready Scores, Smart Reports, lessons, reflections, mock test reports, and your full learner dashboard.",
};

function SubscribeLoading() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600 shadow-card">
      Loading…
    </div>
  );
}

type Props = {
  searchParams?: {
    premiumInvite?: string;
    promo?: string;
  };
};

export default async function SubscribePage({ searchParams }: Props) {
  const premiumInvite = searchParams?.premiumInvite?.trim() ?? "";
  const promo = searchParams?.promo?.trim() ?? "";
  const returnPath = premiumInvite
    ? premiumInviteSubscribePath(premiumInvite)
    : promo
      ? `/subscribe?promo=${encodeURIComponent(promo)}`
      : "/subscribe";

  const user = await requireAuthenticatedSession(returnPath);
  try {
    await syncSubscriptionForUserFromStripe(user.id);
  } catch (error) {
    console.warn("[subscribe] stripe_sync_failed", error);
  }
  const access = await getLearnerAccessStatus(user.id);
  if (access.hasPremiumAccess) redirect("/dashboard");
  if (access.isGraduated) redirect("/graduate");

  let inviteDiscountPercent: number | null = null;
  if (premiumInvite) {
    const invite = await getAdminPremiumInviteByToken(premiumInvite);
    if (invite && resolvePremiumInviteStatus(invite) === "pending" && invite.discount_percent >= 100) {
      redirect(premiumInviteClaimPath(premiumInvite));
    }
    inviteDiscountPercent = invite?.discount_percent ?? null;
  }

  return (
    <div className="pb-4">
      <Suspense fallback={<SubscribeLoading />}>
        <SubscribeFlow
          initialPromoCode={promo}
          initialPremiumInvite={premiumInvite}
          inviteDiscountPercent={inviteDiscountPercent}
        />
      </Suspense>
    </div>
  );
}
