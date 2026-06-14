import "server-only";

import Stripe from "stripe";

const API_VERSION: Stripe.LatestApiVersion = "2024-06-20";

let cachedStripe: Stripe | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function getStripeServerClient(): Stripe {
  if (cachedStripe) return cachedStripe;
  const secretKey = requireEnv("STRIPE_SECRET_KEY");
  if (!secretKey.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY is invalid");
  }
  cachedStripe = new Stripe(secretKey, { apiVersion: API_VERSION });
  return cachedStripe;
}

/** @deprecated legacy one-off tiers — subscription is the primary model */
export type CheckoutPriceTier = "single" | "lifetime" | "subscription";

export function getStripeConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    /** @deprecated use price ids per tier */
    priceId: process.env.STRIPE_PRICE_ID || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  };
}

function subscriptionPriceId(): string {
  const id =
    process.env.STRIPE_PRICE_ID_SUBSCRIPTION ||
    process.env.STRIPE_PRICE_ID_LIFETIME ||
    process.env.STRIPE_PRICE_ID ||
    "";
  if (!id.startsWith("price_")) {
    throw new Error("STRIPE_PRICE_ID_SUBSCRIPTION is not configured");
  }
  return id;
}

function legacyPriceIdForTier(tier: "single" | "lifetime"): string {
  if (tier === "lifetime") {
    const id = process.env.STRIPE_PRICE_ID_LIFETIME || "";
    if (!id.startsWith("price_")) {
      throw new Error("STRIPE_PRICE_ID_LIFETIME is not configured");
    }
    return id;
  }
  const single = process.env.STRIPE_PRICE_ID_SINGLE || process.env.STRIPE_PRICE_ID || "";
  if (!single.startsWith("price_")) {
    throw new Error("STRIPE_PRICE_ID_SINGLE (or STRIPE_PRICE_ID) is not configured");
  }
  return single;
}

export type CheckoutFlowMode = "report" | "upgrade" | "subscription";

export async function createSubscriptionCheckoutSession(params: {
  email?: string;
  userId: string;
  assessmentId?: string;
  weakAreaCount?: number;
  returnPath?: string;
}) {
  const stripe = getStripeServerClient();
  const config = getStripeConfig();
  const priceId = subscriptionPriceId();
  const returnPath = params.returnPath ?? "/checkout/success";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.appUrl}${returnPath}?session_id={CHECKOUT_SESSION_ID}&mode=subscription`,
    cancel_url: `${config.appUrl}/assessment`,
    customer_email: params.email,
    subscription_data: {
      metadata: {
        supabase_user_id: params.userId,
      },
    },
    metadata: {
      tier: "subscription",
      supabase_user_id: params.userId,
      ...(params.assessmentId ? { assessmentId: params.assessmentId } : {}),
      ...(params.weakAreaCount != null ? { weakAreaCount: String(params.weakAreaCount) } : {}),
    },
  });

  return session;
}

/** Legacy one-off checkout — retained for grandfathered payment flows. */
export async function createCheckoutSession(params: {
  assessmentId: string;
  email?: string;
  weakAreaCount: number;
  tier: CheckoutPriceTier;
  userId?: string;
  flowMode?: CheckoutFlowMode;
}) {
  if (params.tier === "subscription") {
    if (!params.userId) throw new Error("userId required for subscription checkout");
    return createSubscriptionCheckoutSession({
      email: params.email,
      userId: params.userId,
      assessmentId: params.assessmentId,
      weakAreaCount: params.weakAreaCount,
    });
  }

  const stripe = getStripeServerClient();
  const config = getStripeConfig();
  const priceId = legacyPriceIdForTier(params.tier);
  const flowMode: CheckoutFlowMode = params.flowMode ?? "report";

  const successQuery =
    flowMode === "upgrade"
      ? "session_id={CHECKOUT_SESSION_ID}&mode=upgrade"
      : "session_id={CHECKOUT_SESSION_ID}";
  const cancelPath = flowMode === "upgrade" ? "/results" : "/assessment";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.appUrl}/checkout/success?${successQuery}`,
    cancel_url: `${config.appUrl}${cancelPath}`,
    customer_email: params.email,
    metadata: {
      assessmentId: params.assessmentId,
      weakAreaCount: String(params.weakAreaCount),
      tier: params.tier,
      upgradeOnly: flowMode === "upgrade" ? "true" : "false",
      ...(params.userId ? { supabase_user_id: params.userId } : {}),
    },
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripeServerClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "subscription"],
  });
}

export async function retrieveSubscription(subscriptionId: string) {
  const stripe = getStripeServerClient();
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelStripeSubscription(subscriptionId: string) {
  const stripe = getStripeServerClient();
  return stripe.subscriptions.cancel(subscriptionId);
}

export function verifyWebhookEvent(payload: string | Buffer, signature: string) {
  const stripe = getStripeServerClient();
  const config = getStripeConfig();
  if (!config.webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
}

export function subscriptionPeriodDates(subscription: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const start = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000)
    : null;
  const end = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
  return { start, end };
}

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): import("@/lib/server/repositories/subscriptions-repository").SubscriptionStatus {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") return "canceled";
  return "inactive";
}
