import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutSuccessFlow } from "@/components/CheckoutSuccessFlow";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Payment confirmed",
  description: "Verifying payment and preparing your Premium TestReady Score Report.",
};

export default function CheckoutSuccessPage() {
  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-2xl"
      eyebrow="Payment"
      title="Preparing your Premium TestReady Score Report"
      subtitle="Confirming payment securely — usually a few seconds."
    >
      <Suspense
        fallback={
          <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-card">
            <p className="text-sm font-medium text-brand-600">Loading…</p>
          </div>
        }
      >
        <CheckoutSuccessFlow />
      </Suspense>
    </Section>
  );
}
