import "server-only";

import type Stripe from "stripe";

import { getSupabaseServerClient } from "@/lib/server/supabase";
import type { PaymentDbRecord } from "@/lib/validation";

type UpsertPaymentInput = {
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  amountTotal: number | null;
  currency: string | null;
  paymentStatus: string;
  customerEmail: string | null;
  fullName: string | null;
  rawMetadata: Record<string, unknown> | null;
};

function asRecord(value: Stripe.Metadata | null | undefined): Record<string, unknown> | null {
  if (!value) return null;
  return Object.fromEntries(Object.entries(value));
}

export function fromCheckoutSessionToPaymentInput(session: Stripe.Checkout.Session): UpsertPaymentInput {
  return {
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
    paymentStatus: session.payment_status ?? "unpaid",
    customerEmail: session.customer_email ?? null,
    fullName: session.customer_details?.name ?? null,
    rawMetadata: asRecord(session.metadata),
  };
}

export async function upsertPaymentFromCheckoutSession(input: UpsertPaymentInput): Promise<PaymentDbRecord> {
  const supabase = getSupabaseServerClient();
  const payload = {
    stripe_session_id: input.stripeSessionId,
    stripe_payment_intent_id: input.stripePaymentIntentId,
    amount_total: input.amountTotal,
    currency: input.currency,
    payment_status: input.paymentStatus,
    customer_email: input.customerEmail,
    full_name: input.fullName,
    raw_metadata: input.rawMetadata,
  };

  const { data, error } = await supabase
    .from("payments")
    .upsert(payload, { onConflict: "stripe_session_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to upsert payment");
  }
  return data as PaymentDbRecord;
}

export async function getPaymentByStripeSessionId(stripeSessionId: string): Promise<PaymentDbRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to fetch payment");
  }
  return (data as PaymentDbRecord | null) ?? null;
}

export async function getRecentSales(limit = 20): Promise<PaymentDbRecord[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("Failed to fetch recent sales");
  return (data as PaymentDbRecord[]) ?? [];
}
