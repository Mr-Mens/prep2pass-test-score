import "server-only";

import { isMissingCommercialTableError } from "@/lib/server/commercial-schema";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type SubscriptionStatus = "inactive" | "active" | "past_due" | "canceled" | "trialing";

export type UserSubscriptionRow = {
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  admin_promo_code_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getSubscriptionByUserId(userId: string): Promise<UserSubscriptionRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("user_subscriptions").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    if (isMissingCommercialTableError(error)) return null;
    console.warn("[subscriptions] getSubscriptionByUserId failed", error.message);
    return null;
  }
  return data as UserSubscriptionRow | null;
}

export async function upsertSubscription(input: {
  userId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd?: boolean;
  adminPromoCodeId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: input.userId,
      stripe_subscription_id: input.stripeSubscriptionId,
      stripe_customer_id: input.stripeCustomerId,
      status: input.status,
      current_period_start: input.currentPeriodStart?.toISOString() ?? null,
      current_period_end: input.currentPeriodEnd?.toISOString() ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      ...(input.adminPromoCodeId !== undefined ? { admin_promo_code_id: input.adminPromoCodeId } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[subscriptions] upsertSubscription failed", error.message);
    throw new Error("Failed to save subscription");
  }
}

/** Grant Premium from a 100% admin invite without Stripe Checkout. */
export async function grantGiftPremiumSubscription(input: {
  userId: string;
  giftSubscriptionId: string;
  adminPromoCodeId?: string | null;
}): Promise<void> {
  const now = new Date();
  await upsertSubscription({
    userId: input.userId,
    stripeSubscriptionId: input.giftSubscriptionId,
    stripeCustomerId: null,
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    adminPromoCodeId: input.adminPromoCodeId ?? null,
  });
}

export async function updateSubscriptionStatus(input: {
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data: existing, error: readErr } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", input.stripeSubscriptionId)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!existing) return null;

  const patch: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  if (input.currentPeriodStart !== undefined) {
    patch.current_period_start = input.currentPeriodStart?.toISOString() ?? null;
  }
  if (input.currentPeriodEnd !== undefined) {
    patch.current_period_end = input.currentPeriodEnd?.toISOString() ?? null;
  }
  if (input.cancelAtPeriodEnd !== undefined) {
    patch.cancel_at_period_end = input.cancelAtPeriodEnd;
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .update(patch)
    .eq("stripe_subscription_id", input.stripeSubscriptionId);
  if (error) throw new Error(error.message);
  return (existing as { user_id: string }).user_id;
}

export function subscriptionGrantsPremium(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

export async function cancelSubscriptionAtPeriodEnd(userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function cancelSubscriptionImmediately(userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
