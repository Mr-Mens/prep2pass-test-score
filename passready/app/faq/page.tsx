import type { Metadata } from "next";

import { FaqItem } from "@/components/FaqItem";
import { Section } from "@/components/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { PUBLIC_FAQ } from "@/lib/content/public-faq";
import { faqPageJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ",
  description:
    "Answers about Pass Pilot pricing, DVSA independence, instructor use, parent supervision, billing after you pass, and secure report storage.",
  path: "/faq",
});

export default async function FaqPage() {
  await redirectIfAuthenticated();

  return (
    <>
      <JsonLd data={faqPageJsonLd(PUBLIC_FAQ)} />
      <Section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">FAQ</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Frequently asked questions
          </h1>
          <div className="mt-10 space-y-4">
            {PUBLIC_FAQ.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
