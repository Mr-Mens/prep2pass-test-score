import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";

export type CustomerEntitlementRow = {
  user_id: string;
  lifetime_access: boolean;
  updated_at: string;
};

export type EntitlementLookupResult = {
  hasLifetimeAccess: boolean;
  hasPurchasedSingleReport: boolean;
  reportCount: number;
  hasActiveSubscription: boolean;
  isGraduated: boolean;
  subscriptionStatus: string | null;
};

/** Lifetime unlock for Stripe / finalise flows keyed to the signed-in Supabase account. */
export async function getLifetimeAccessByUserId(userId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("lifetime_access")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[entitlements] getLifetimeAccessByUserId failed", error.message);
    throw new Error("Failed to read entitlements");
  }
  const row = data as { lifetime_access: boolean } | null;
  return row?.lifetime_access === true;
}

export async function setLifetimeAccessByUserId(userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_entitlements").upsert(
    {
      user_id: userId,
      lifetime_access: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[entitlements] setLifetimeAccessByUserId failed", error.message);
    throw new Error("Failed to save lifetime access");
  }
}

function paymentLooksLikeSinglePurchase(rawMetadata: Record<string, unknown> | null): boolean {
  const tier = rawMetadata?.tier;
  if (tier === "lifetime") return false;
  if (tier === "single") return true;
  return rawMetadata?.upgradeOnly !== "true";
}

export async function getEntitlementLookupForUser(userId: string): Promise<EntitlementLookupResult> {
  const supabase = getSupabaseServerClient();

  const [access, reportsCountRes, paymentsRes] = await Promise.all([
    getLearnerAccessStatus(userId),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("payments").select("raw_metadata, payment_status").eq("user_id", userId),
  ]);

  if (reportsCountRes.error) throw new Error("Failed to count reports");
  if (paymentsRes.error) throw new Error("Failed to read payments");

  const reportCount = reportsCountRes.count ?? 0;

  const rows = (paymentsRes.data ?? []) as { raw_metadata: Record<string, unknown> | null; payment_status: string }[];
  let hasPurchasedSingleReport = false;
  for (const row of rows) {
    if (row.payment_status !== "paid") continue;
    if (paymentLooksLikeSinglePurchase(row.raw_metadata)) {
      hasPurchasedSingleReport = true;
      break;
    }
  }

  return {
    hasLifetimeAccess: access.hasPremiumAccess,
    hasPurchasedSingleReport,
    reportCount,
    hasActiveSubscription: access.accessSource === "subscription" && access.hasPremiumAccess,
    isGraduated: access.isGraduated,
    subscriptionStatus: access.subscriptionStatus,
  };
}
