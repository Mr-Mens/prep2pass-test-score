import "server-only";

import Stripe from "stripe";

import { PRODUCT, PRICING, SITE } from "@/lib/constants";

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

/** @deprecated legacy one-off tiers, subscription is the primary model */
export type CheckoutPriceTier = "single" | "lifetime" | "subscription";

export function getStripeConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    /** @deprecated use price ids per tier */
    priceId: process.env.STRIPE_PRICE_ID || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  };
}

export function stripeKeyMode(): "live" | "test" | "unknown" {
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (secret.startsWith("sk_live_")) return "live";
  if (secret.startsWith("sk_test_")) return "test";
  return "unknown";
}

export function isStripeSubscriptionCheckoutReady(): boolean {
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const price = process.env.STRIPE_PRICE_ID_SUBSCRIPTION?.trim() ?? "";
  return secret.startsWith("sk_") && price.startsWith("price_");
}

function subscriptionPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID_SUBSCRIPTION?.trim() ?? "";
  if (!id.startsWith("price_")) {
    throw new Error("STRIPE_PRICE_ID_SUBSCRIPTION is not configured");
  }
  return id;
}

/** Shown on Checkout (header + line item) — kept in sync with the Stripe Product on checkout. */
export const STRIPE_SUBSCRIPTION_PRODUCT_NAME = `${PRODUCT.name} Premium`;

function checkoutSessionBranding(): { branding_settings: { display_name: string } } {
  return { branding_settings: { display_name: SITE.name } };
}

async function ensureSubscriptionProductBranded(price: Stripe.Price): Promise<void> {
  const stripe = getStripeServerClient();
  const productRef = price.product;
  const productId = typeof productRef === "string" ? productRef : productRef.id;
  const product =
    typeof productRef === "object" && productRef !== null && !("deleted" in productRef)
      ? productRef
      : await stripe.products.retrieve(productId);

  if ("deleted" in product && product.deleted) return;
  if (product.name === STRIPE_SUBSCRIPTION_PRODUCT_NAME) return;

  await stripe.products.update(productId, { name: STRIPE_SUBSCRIPTION_PRODUCT_NAME });
}

/** Confirms the subscription price exists on the same Stripe account/mode as the secret key. */
export async function assertSubscriptionPriceAvailable(): Promise<void> {
  const stripe = getStripeServerClient();
  const priceId = subscriptionPriceId();
  const keyMode = stripeKeyMode();

  let price: Stripe.Price;
  try {
    price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
      console.error("[checkout] subscription_price_missing", {
        priceId,
        keyMode,
        stripeCode: error.code,
        stripeMessage: error.message,
      });
      throw new Error("STRIPE_SUBSCRIPTION_PRICE_NOT_FOUND");
    }
    throw error;
  }

  const priceMode = price.livemode ? "live" : "test";
  if (keyMode !== "unknown" && priceMode !== keyMode) {
    console.error("[checkout] subscription_price_mode_mismatch", {
      priceId,
      keyMode,
      priceMode,
    });
    throw new Error("STRIPE_SUBSCRIPTION_PRICE_MODE_MISMATCH");
  }

  if (!price.active) {
    console.error("[checkout] subscription_price_inactive", { priceId, keyMode, priceMode });
    throw new Error("STRIPE_SUBSCRIPTION_PRICE_INACTIVE");
  }

  try {
    await ensureSubscriptionProductBranded(price);
  } catch (error) {
    console.warn("[checkout] subscription_product_branding_sync_failed", {
      priceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
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
  cancelPath?: string;
  stripePromotionCodeId?: string;
  trialPeriodDays?: number;
  promoMetadata?: {
    adminPromoCodeId?: string;
    adminPremiumInviteId?: string;
    promotionType?: "discount" | "trial_extension";
    trialDays?: number;
  };
}) {
  await assertSubscriptionPriceAvailable();

  const stripe = getStripeServerClient();
  const config = getStripeConfig();
  const priceId = subscriptionPriceId();
  const returnPath = params.returnPath ?? "/checkout/success";
  const cancelPath = params.cancelPath ?? "/assessment";
  const trialPeriodDays = params.trialPeriodDays ?? PRICING.subscription.trialDays;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...checkoutSessionBranding(),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.appUrl}${returnPath}?session_id={CHECKOUT_SESSION_ID}&mode=subscription`,
    cancel_url: `${config.appUrl}${cancelPath}`,
    customer_email: params.email,
    payment_method_collection: "always",
    ...(params.stripePromotionCodeId
      ? { discounts: [{ promotion_code: params.stripePromotionCodeId }] }
      : params.promoMetadata?.adminPromoCodeId
        ? {}
        : { allow_promotion_codes: true }),
    subscription_data: {
      trial_period_days: trialPeriodDays,
      description: `${SITE.name}: ${PRICING.subscription.label}`,
      metadata: {
        supabase_user_id: params.userId,
        ...(params.promoMetadata?.adminPromoCodeId
          ? { admin_promo_code_id: params.promoMetadata.adminPromoCodeId }
          : {}),
        ...(params.promoMetadata?.promotionType
          ? { promotion_type: params.promoMetadata.promotionType }
          : {}),
        ...(params.promoMetadata?.trialDays != null
          ? { promotion_trial_days: String(params.promoMetadata.trialDays) }
          : {}),
      },
    },
    metadata: {
      tier: "subscription",
      supabase_user_id: params.userId,
      ...(params.assessmentId ? { assessmentId: params.assessmentId } : {}),
      ...(params.weakAreaCount != null ? { weakAreaCount: String(params.weakAreaCount) } : {}),
      ...(params.promoMetadata?.adminPromoCodeId
        ? { admin_promo_code_id: params.promoMetadata.adminPromoCodeId }
        : {}),
      ...(params.promoMetadata?.adminPremiumInviteId
        ? { admin_premium_invite_id: params.promoMetadata.adminPremiumInviteId }
        : {}),
      ...(params.promoMetadata?.promotionType
        ? { promotion_type: params.promoMetadata.promotionType }
        : {}),
      ...(params.promoMetadata?.trialDays != null
        ? { promotion_trial_days: String(params.promoMetadata.trialDays) }
        : {}),
    },
  });

  return session;
}

/** Legacy one-off checkout, retained for grandfathered payment flows. */
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
      cancelPath: params.flowMode === "upgrade" ? "/results" : "/assessment",
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
    ...checkoutSessionBranding(),
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
