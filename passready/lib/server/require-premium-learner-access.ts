import "server-only";

import { redirect } from "next/navigation";

import { getCachedLearnerAccessStatus } from "@/lib/server/learner-access";
import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";

/** Redirect free learners to subscribe (or assessment when they have not upgraded yet). */
export async function requirePremiumLearnerAccess(returnPath: string) {
  const user = await requireAuthenticatedSession(returnPath);
  const access = await getCachedLearnerAccessStatus(user.id);

  if (access.hasPremiumAccess) {
    return { user, access };
  }

  const next = encodeURIComponent(returnPath);
  if (access.hasUsedFreeAssessment) {
    redirect(`/assessment?next=${next}`);
  }
  redirect(`/subscribe?next=${next}`);
}
