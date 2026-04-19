import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  fromCheckoutSessionToPaymentInput,
  upsertPaymentFromCheckoutSession,
} from "@/lib/server/repositories/payments-repository";
import { verifyWebhookEvent } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = headers().get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = verifyWebhookEvent(payload, signature);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await upsertPaymentFromCheckoutSession(fromCheckoutSessionToPaymentInput(session));
      console.log("stripe_webhook_checkout_completed", {
        sessionId: session.id,
        paymentStatus: session.payment_status,
      });
    } catch {
      // Keep webhook resilient even if persistence is temporarily unavailable.
      console.error("stripe_webhook_payment_upsert_failed", { sessionId: session.id });
    }
  }

  return NextResponse.json({ received: true });
}
