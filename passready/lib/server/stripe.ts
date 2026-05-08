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

export type CheckoutPriceTier = "single" | "lifetime";

export function getStripeConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    /** @deprecated use price ids per tier */
    priceId: process.env.STRIPE_PRICE_ID || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  };
}

function priceIdForTier(tier: CheckoutPriceTier): string {
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

export type CheckoutFlowMode = "report" | "upgrade";

export async function createCheckoutSession(params: {
  assessmentId: string;
  email?: string;
  weakAreaCount: number;
  tier: CheckoutPriceTier;
  /** Signed-in Prep2Pass user (Supabase auth id). Wired into Stripe metadata for secure fulfilment. */
  userId?: string;
  /** "upgrade" = lifetime entitlement only, no new report. Defaults to "report". */
  flowMode?: CheckoutFlowMode;
}) {
  const stripe = getStripeServerClient();
  const config = getStripeConfig();
  const priceId = priceIdForTier(params.tier);
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
    expand: ["payment_intent"],
  });
}

export function verifyWebhookEvent(payload: string | Buffer, signature: string) {
  const stripe = getStripeServerClient();
  const config = getStripeConfig();
  if (!config.webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
}
