import type { Metadata } from "next";

import { LandingPricing } from "@/components/LandingPricing";
import { Section } from "@/components/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRICING } from "@/lib/constants";
import { productOfferJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description: `Pass Pilot for learners is ${PRICING.subscription.display}/month until you pass or cancel. Instructors and parents are free.`,
  path: "/pricing",
});

export default async function PricingPage() {
  await redirectIfAuthenticated();

  return (
    <>
      <JsonLd data={productOfferJsonLd()} />
      <Section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Pricing</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Simple pricing
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-600">
            Learners pay {PRICING.subscription.display}/month until they pass or cancel. Instructors and parents use
            Pass Pilot free.
          </p>
          <div className="mt-10">
            <LandingPricing />
          </div>
        </div>
      </Section>
    </>
  );
}
