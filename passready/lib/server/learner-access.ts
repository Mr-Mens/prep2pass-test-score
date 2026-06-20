import "server-only";

import { cache } from "react";

import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { getGraduationByUserId } from "@/lib/server/repositories/graduations-repository";
import {
  getSubscriptionByUserId,
  subscriptionGrantsPremium,
  type SubscriptionStatus,
} from "@/lib/server/repositories/subscriptions-repository";
import { getUserAppRole } from "@/lib/server/user-app-role";

export type LearnerAccessSource = "none" | "subscription" | "legacy_lifetime" | "instructor" | "parent";

export type LearnerAccessStatus = {
  hasPremiumAccess: boolean;
  canStartAssessment: boolean;
  isGraduated: boolean;
  passDate: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  accessSource: LearnerAccessSource;
  /** Back-compat alias used across the app */
  lifetimeAccess: boolean;
};

export async function getLearnerAccessStatus(userId: string): Promise<LearnerAccessStatus> {
  const [role, legacyLifetime, subscription, graduation] = await Promise.all([
    getUserAppRole(userId),
    getLifetimeAccessByUserId(userId),
    getSubscriptionByUserId(userId),
    getGraduationByUserId(userId),
  ]);

  if (role === "instructor") {
    return {
      hasPremiumAccess: true,
      canStartAssessment: true,
      isGraduated: false,
      passDate: null,
      subscriptionStatus: null,
      accessSource: "instructor",
      lifetimeAccess: true,
    };
  }

  if (role === "parent") {
    return {
      hasPremiumAccess: false,
      canStartAssessment: false,
      isGraduated: false,
      passDate: null,
      subscriptionStatus: null,
      accessSource: "parent",
      lifetimeAccess: false,
    };
  }

  const isGraduated = Boolean(graduation);
  const passDate = graduation?.pass_date ?? null;
  const subscriptionStatus = subscription?.status ?? null;
  const hasActiveSubscription = subscriptionStatus ? subscriptionGrantsPremium(subscriptionStatus) : false;

  let accessSource: LearnerAccessSource = "none";
  let hasPremiumAccess = false;

  if (legacyLifetime) {
    hasPremiumAccess = true;
    accessSource = "legacy_lifetime";
  } else if (hasActiveSubscription) {
    hasPremiumAccess = true;
    accessSource = "subscription";
  } else if (isGraduated) {
    hasPremiumAccess = true;
    accessSource = "legacy_lifetime";
  }

  return {
    hasPremiumAccess,
    canStartAssessment: !isGraduated,
    isGraduated,
    passDate,
    subscriptionStatus,
    accessSource,
    lifetimeAccess: hasPremiumAccess,
  };
}

/** Per-request dedupe when layouts and pages both read access. */
export const getCachedLearnerAccessStatus = cache(getLearnerAccessStatus);
