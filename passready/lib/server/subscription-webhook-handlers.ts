import "server-only";

import type Stripe from "stripe";

import {
  activateReferralOnSubscription,
  processReferralSubscriptionPayment,
} from "@/lib/server/repositories/referrals-repository";
import { sendSubscriptionConfirmationEmail } from "@/lib/email/templates/subscription-confirmation";
import { lookupUserContact } from "@/lib/server/lookup-user-contact";
import {
  incrementAdminPromoRedemption,
  markAdminPremiumInviteRedeemed,
} from "@/lib/server/repositories/admin-promo-repository";
import {
  mapStripeSubscriptionStatus,
  subscriptionPeriodDates,
} from "@/lib/server/stripe";
import {
  upsertSubscription,
  updateSubscriptionStatus,
} from "@/lib/server/repositories/subscriptions-repository";

function metadataUserId(meta: Stripe.Metadata | null | undefined): string | null {
  const raw = meta?.supabase_user_id;
  return typeof raw === "string" && raw.trim().length ? raw.trim() : null;
}

export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription): Promise<string | null> {
  const userId = metadataUserId(subscription.metadata);
  if (!userId) return null;

  const status = mapStripeSubscriptionStatus(subscription.status);
  const { start, end } = subscriptionPeriodDates(subscription);
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;

  await upsertSubscription({
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    status,
    currentPeriodStart: start,
    currentPeriodEnd: end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  return userId;
}

export async function handleSubscriptionCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = metadataUserId(session.metadata);
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  if (!userId || !subscriptionId) return;

  const stripe = await import("@/lib/server/stripe").then((m) => m.getStripeServerClient());
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionFromStripe(subscription);
  await activateReferralOnSubscription(userId);

  const promoCodeId = session.metadata?.admin_promo_code_id;
  const inviteId = session.metadata?.admin_premium_invite_id;
  if (promoCodeId) await incrementAdminPromoRedemption(promoCodeId);
  if (inviteId) await markAdminPremiumInviteRedeemed(inviteId, userId);

  const contact = await lookupUserContact(userId);
  const toEmail =
    (typeof session.customer_email === "string" && session.customer_email.trim()) || contact.email;
  if (toEmail) {
    try {
      await sendSubscriptionConfirmationEmail({
        toEmail,
        firstName: contact.firstName,
      });
    } catch (e) {
      console.error("[subscription-email] confirmation_failed", e);
    }
  }
}

export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id ?? null;
  if (!subscriptionId || invoice.status !== "paid") return;

  const stripe = await import("@/lib/server/stripe").then((m) => m.getStripeServerClient());
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = await syncSubscriptionFromStripe(subscription);
  if (!userId) return;

  const { start, end } = subscriptionPeriodDates(subscription);
  const isFirstPaidInvoice = invoice.billing_reason === "subscription_create";

  await processReferralSubscriptionPayment({
    pupilId: userId,
    stripeInvoiceId: invoice.id,
    periodStart: start ?? undefined,
    periodEnd: end ?? undefined,
    isFirstPaidInvoice,
  });
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  await syncSubscriptionFromStripe(subscription);
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  await updateSubscriptionStatus({
    stripeSubscriptionId: subscription.id,
    status: "canceled",
    cancelAtPeriodEnd: false,
  });
}
