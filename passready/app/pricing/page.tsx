import type { Metadata } from "next";

import { LandingPricing } from "@/components/LandingPricing";
import { Section } from "@/components/Section";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = {
  title: "Pricing · Test Ready Score",
  description: "Simple pricing for Test Ready Score — single report or lifetime access.",
};

export default async function PricingPage() {
  await redirectIfAuthenticated();

  return (
    <Section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Pricing</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          Simple, honest pricing
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-600">
          One Premium report when you need a checkpoint, or lifetime access if you want progress tracking and unlimited
          reports.
        </p>
        <div className="mt-10">
          <LandingPricing />
        </div>
      </div>
    </Section>
  );
}
