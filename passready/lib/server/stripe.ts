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

export function getStripeConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    priceId: process.env.STRIPE_PRICE_ID || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  };
}

export async function createCheckoutSession(params: {
  assessmentId: string;
  email?: string;
  weakAreaCount: number;
}) {
  const stripe = getStripeServerClient();
  const config = getStripeConfig();
  if (!config.priceId) {
    throw new Error("STRIPE_PRICE_ID is not configured");
  }
  if (!config.priceId.startsWith("price_")) {
    throw new Error("STRIPE_PRICE_ID is invalid");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: config.priceId, quantity: 1 }],
    success_url: `${config.appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.appUrl}/assessment`,
    customer_email: params.email,
    metadata: {
      assessmentId: params.assessmentId,
      weakAreaCount: String(params.weakAreaCount),
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
