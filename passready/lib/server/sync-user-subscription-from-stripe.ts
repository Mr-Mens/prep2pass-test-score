import "server-only";

import type Stripe from "stripe";

import {
  getSubscriptionByUserId,
  subscriptionGrantsPremium,
} from "@/lib/server/repositories/subscriptions-repository";
import {
  handleSubscriptionCheckoutCompleted,
  syncSubscriptionFromStripe,
} from "@/lib/server/subscription-webhook-handlers";
import {
  getStripeServerClient,
  mapStripeSubscriptionStatus,
  retrieveCheckoutSession,
} from "@/lib/server/stripe";

function sessionOwnerUserId(session: Stripe.Checkout.Session): string | null {
  const raw = session.metadata?.supabase_user_id;
  return typeof raw === "string" && raw.trim().length ? raw.trim() : null;
}

function checkoutSessionIsComplete(session: Stripe.Checkout.Session): boolean {
  if (session.status === "complete") return true;
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

/** Pull active/trialing subscription rows from Stripe into Supabase (webhook fallback). */
export async function syncSubscriptionForUserFromStripe(userId: string): Promise<boolean> {
  const existing = await getSubscriptionByUserId(userId);
  if (existing && subscriptionGrantsPremium(existing.status)) {
    return true;
  }

  const stripe = getStripeServerClient();

  try {
    const search = await stripe.subscriptions.search({
      query: `metadata['supabase_user_id']:'${userId}'`,
      limit: 5,
    });

    let syncedPremium = false;
    for (const subscription of search.data) {
      await syncSubscriptionFromStripe(subscription);
      const status = mapStripeSubscriptionStatus(subscription.status);
      if (subscriptionGrantsPremium(status)) {
        syncedPremium = true;
      }
    }

    if (syncedPremium) return true;
  } catch (error) {
    console.warn("[subscription:sync] stripe_search_failed", {
      userId,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const refreshed = await getSubscriptionByUserId(userId);
  return Boolean(refreshed && subscriptionGrantsPremium(refreshed.status));
}

/** Confirm a completed subscription Checkout Session and persist premium access. */
export async function confirmSubscriptionCheckoutForUser(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const session = await retrieveCheckoutSession(sessionId);

  if (session.mode !== "subscription") {
    throw new Error("NOT_SUBSCRIPTION_CHECKOUT");
  }

  const ownerId = sessionOwnerUserId(session);
  if (!ownerId || ownerId !== userId) {
    throw new Error("CHECKOUT_OWNERSHIP");
  }

  if (!checkoutSessionIsComplete(session)) {
    return false;
  }

  await handleSubscriptionCheckoutCompleted(session);

  const row = await getSubscriptionByUserId(userId);
  return Boolean(row && subscriptionGrantsPremium(row.status));
}
