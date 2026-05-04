import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";

export type CustomerEntitlementRow = {
  email: string;
  lifetime_access: boolean;
  updated_at: string;
};

export async function getLifetimeAccess(emailNormalized: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customer_entitlements")
    .select("lifetime_access")
    .eq("email", emailNormalized)
    .maybeSingle();

  if (error) {
    console.error("[entitlements] getLifetimeAccess failed", error.message);
    throw new Error("Failed to read entitlements");
  }
  const row = data as { lifetime_access: boolean } | null;
  return row?.lifetime_access === true;
}

export async function setLifetimeAccess(emailNormalized: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("customer_entitlements").upsert(
    {
      email: emailNormalized,
      lifetime_access: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[entitlements] setLifetimeAccess failed", error.message);
    throw new Error("Failed to save lifetime access");
  }
}

export type EntitlementLookupResult = {
  hasLifetimeAccess: boolean;
  hasPurchasedSingleReport: boolean;
  reportCount: number;
};

function paymentLooksLikeSinglePurchase(rawMetadata: Record<string, unknown> | null): boolean {
  const tier = rawMetadata?.tier;
  if (tier === "lifetime") return false;
  if (tier === "single") return true;
  return true;
}

export async function getEntitlementLookup(emailNormalized: string): Promise<EntitlementLookupResult> {
  const supabase = getSupabaseServerClient();

  const [entRes, reportsCountRes, paymentsRes] = await Promise.all([
    supabase.from("customer_entitlements").select("lifetime_access").eq("email", emailNormalized).maybeSingle(),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("email", emailNormalized),
    supabase.from("payments").select("raw_metadata, payment_status").eq("customer_email", emailNormalized),
  ]);

  if (entRes.error) throw new Error("Failed to read entitlements");
  if (reportsCountRes.error) throw new Error("Failed to count reports");
  if (paymentsRes.error) throw new Error("Failed to read payments");

  const hasLifetimeAccess =
    (entRes.data as { lifetime_access: boolean } | null)?.lifetime_access === true;

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

  return { hasLifetimeAccess, hasPurchasedSingleReport, reportCount };
}
