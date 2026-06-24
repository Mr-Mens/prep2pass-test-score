import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { setLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import {
  fromCheckoutSessionToPaymentInput,
  upsertPaymentFromCheckoutSession,
} from "@/lib/server/repositories/payments-repository";
import {
  handleInvoicePaid,
  handleInvoicePaymentSucceeded,
  handleSubscriptionCheckoutCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "@/lib/server/subscription-webhook-handlers";
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

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        if (session.mode === "subscription") {
          await handleSubscriptionCheckoutCompleted(session);
        } else {
          await upsertPaymentFromCheckoutSession(fromCheckoutSessionToPaymentInput(session));

          const tier = session.metadata?.tier;
          const userIdRaw = session.metadata?.supabase_user_id;
          const userId = typeof userIdRaw === "string" && userIdRaw.trim().length ? userIdRaw.trim() : null;

          if (session.payment_status === "paid" && tier === "lifetime" && userId) {
            await setLifetimeAccessByUserId(userId);
          }
        }

        console.log("stripe_webhook_checkout_completed", {
          sessionId: session.id,
          mode: session.mode,
          paymentStatus: session.payment_status,
        });
      } catch (e) {
        console.error("stripe_webhook_checkout_failed", {
          sessionId: session.id,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if (event.type === "invoice.paid") {
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
    }

    if (event.type === "invoice.payment_succeeded") {
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
    }

    if (event.type === "customer.subscription.updated") {
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
    }

    if (event.type === "customer.subscription.deleted") {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    }
  } catch (e) {
    console.error("stripe_webhook_handler_failed", {
      type: event.type,
      message: e instanceof Error ? e.message : String(e),
    });
  }

  return NextResponse.json({ received: true });
}
