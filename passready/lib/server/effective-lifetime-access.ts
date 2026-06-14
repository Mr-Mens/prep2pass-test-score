import "server-only";

import { getLearnerAccessStatus } from "@/lib/server/learner-access";

/**
 * Premium access for learners: active subscription, legacy lifetime, or instructor role.
 */
export async function getEffectiveLifetimeAccessByUserId(userId: string): Promise<boolean> {
  const access = await getLearnerAccessStatus(userId);
  return access.hasPremiumAccess;
}

export async function canLearnerStartAssessment(userId: string): Promise<boolean> {
  const access = await getLearnerAccessStatus(userId);
  return access.canStartAssessment;
}
