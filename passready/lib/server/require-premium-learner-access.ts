import "server-only";

import { redirect } from "next/navigation";

import { getCachedLearnerAccessStatus, getLearnerAccessStatus } from "@/lib/server/learner-access";
import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";
import { syncSubscriptionForUserFromStripe } from "@/lib/server/sync-user-subscription-from-stripe";

/** Redirect free learners to subscribe (or assessment when they have not upgraded yet). */
export async function requirePremiumLearnerAccess(returnPath: string) {
  const user = await requireAuthenticatedSession(returnPath);
  let access = await getCachedLearnerAccessStatus(user.id);

  if (!access.hasPremiumAccess) {
    try {
      const synced = await syncSubscriptionForUserFromStripe(user.id);
      if (synced) {
        access = await getLearnerAccessStatus(user.id);
      }
    } catch (error) {
      console.warn("[premium-access] stripe_sync_failed", error);
    }
  }

  if (access.hasPremiumAccess) {
    return { user, access };
  }

  const next = encodeURIComponent(returnPath);
  if (access.hasUsedFreeAssessment) {
    redirect(`/assessment?next=${next}`);
  }
  redirect(`/subscribe?next=${next}`);
}
