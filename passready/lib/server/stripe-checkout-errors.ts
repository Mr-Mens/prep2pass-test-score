import "server-only";

import Stripe from "stripe";

export function checkoutErrorResponse(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  if (error instanceof Stripe.errors.StripeError) {
    const code = error.code ?? "STRIPE_ERROR";
    console.error("[checkout] stripe_error", {
      type: error.type,
      code,
      message: error.message,
    });
    if (code === "resource_missing") {
      return {
        status: 500,
        code: "STRIPE_SESSION_ERROR",
        message:
          "Checkout is unavailable because subscription pricing is not set up correctly in Stripe. Please contact support.",
      };
    }
    if (code === "authentication_error") {
      return {
        status: 500,
        code: "STRIPE_SESSION_ERROR",
        message: "Checkout is unavailable because payment credentials are invalid on the server.",
      };
    }
    return {
      status: 500,
      code: "STRIPE_SESSION_ERROR",
      message: "Checkout is temporarily unavailable. Please try again in a moment.",
    };
  }

  if (error instanceof Error) {
    console.error("[checkout] error", { message: error.message });
    if (error.message === "PROMO_MIGRATION_REQUIRED") {
      return {
        status: 503,
        code: "CHECKOUT_CONFIG_ERROR",
        message: "Promo codes are not available yet. Clear the promo field and try again.",
      };
    }
    if (error.message === "SUPABASE_UNREACHABLE") {
      return {
        status: 503,
        code: "CHECKOUT_CONFIG_ERROR",
        message: "We could not reach the database. Please try again shortly.",
      };
    }
    if (
      error.message.includes("STRIPE_PRICE_ID") ||
      error.message.includes("STRIPE_SECRET_KEY") ||
      error.message.includes("is not configured")
    ) {
      return {
        status: 503,
        code: "CHECKOUT_CONFIG_ERROR",
        message: "Subscription checkout is not configured on the server yet.",
      };
    }
    if (error.message === "Failed to read subscription") {
      return {
        status: 503,
        code: "CHECKOUT_CONFIG_ERROR",
        message: "We could not confirm your account status. Please try again shortly.",
      };
    }
  }

  return {
    status: 500,
    code: "CHECKOUT_FAILED",
    message: "Checkout is temporarily unavailable.",
  };
}
