import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutSuccessFlow } from "@/components/CheckoutSuccessFlow";
import { PRODUCT, SMART_UI } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Payment confirmed",
  description: `Verifying payment and preparing your ${SMART_UI.report}.`,
};

export default function CheckoutSuccessPage() {
  return (
    <div className="flex flex-col gap-6 pb-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Payment</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand-950">
          Preparing your {SMART_UI.report}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Confirming payment securely, usually in a few seconds.
        </p>
      </header>
      <Suspense
        fallback={
          <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-brand-600">Loading…</p>
          </div>
        }
      >
        <CheckoutSuccessFlow />
      </Suspense>
    </div>
  );
}
