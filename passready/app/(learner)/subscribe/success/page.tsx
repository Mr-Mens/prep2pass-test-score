import type { Metadata } from "next";
import { Suspense } from "react";

import { SubscribeSuccessFlow } from "@/components/SubscribeSuccessFlow";

export const metadata: Metadata = {
  title: "Subscription active · Pass Pilot",
};

function SubscribeSuccessLoading() {
  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-teal-200 bg-teal-50/60 p-8 text-center shadow-card">
      <p className="text-sm text-brand-600">Loading…</p>
    </section>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={<SubscribeSuccessLoading />}>
      <SubscribeSuccessFlow />
    </Suspense>
  );
}
