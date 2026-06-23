import { readFileSync } from "fs";

import Stripe from "stripe";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
}

const key = process.env.STRIPE_SECRET_KEY || "";
const priceId = process.env.STRIPE_PRICE_ID_SUBSCRIPTION || "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function main() {
  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}&mode=subscription`,
      cancel_url: `${appUrl}/subscribe`,
      customer_email: "test@example.com",
      payment_method_collection: "always",
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: "test-user" },
      },
      metadata: { tier: "subscription", supabase_user_id: "test-user" },
    });
    console.log("OK session:", session.id);
  } catch (e) {
    const err = e as { message?: string; code?: string; type?: string };
    console.error("FAIL", err.type, err.code, err.message);
    process.exit(1);
  }
}

void main();
