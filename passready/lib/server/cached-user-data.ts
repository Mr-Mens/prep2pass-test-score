import "server-only";

import { cache } from "react";

import {
  getLatestReportForDashboard,
  getLatestReportTestBooking,
  getRecentReportSummaries as fetchRecentReportSummaries,
  listJourneySnapshotsByUserId,
} from "@/lib/server/repositories/reports-repository";
import { getEntitlementLookupForUser } from "@/lib/server/repositories/entitlements-repository";
import { getServerAuthUser, type ServerAuthUser } from "@/lib/supabase/server";
import type { LearnerAccessStatus } from "@/lib/server/learner-access";

/** Alias for readability in pages/layouts. */
export const getCachedServerAuthUser = getServerAuthUser;

export const getCurrentUserProfile = cache(async (): Promise<ServerAuthUser | null> => {
  return getCachedServerAuthUser();
});

export const getSubscriptionStatus = cache(async (userId: string): Promise<LearnerAccessStatus> => {
  const { getCachedLearnerAccessStatus } = await import("@/lib/server/learner-access");
  return getCachedLearnerAccessStatus(userId);
});

export const getLatestReportSummary = cache(async (userId: string) => {
  return getLatestReportForDashboard(userId);
});

export const getCachedRecentReportSummaries = cache(async (userId: string, limit = 3) => {
  return fetchRecentReportSummaries(userId, limit);
});

export const getDashboardJourneySnapshots = cache(async (userId: string) => {
  return listJourneySnapshotsByUserId(userId);
});

export const getDashboardEntitlements = cache(async (userId: string) => {
  return getEntitlementLookupForUser(userId);
});

export const getDashboardTestBooking = cache(async (userId: string) => {
  return getLatestReportTestBooking(userId);
});
