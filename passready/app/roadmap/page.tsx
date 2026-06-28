import type { Metadata } from "next";

import { PublicRoadmap } from "@/components/marketing/PublicRoadmap";
import { Section } from "@/components/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROADMAP_INTRO } from "@/lib/content/public-roadmap";
import { PRODUCT } from "@/lib/constants";
import { webPageJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Product roadmap",
  description: `See what is live, in build and planned for ${PRODUCT.name}: Test Ready Score, Coaching Tools, Theory Hub, Driving Routes and more for learners, instructors and supervisors.`,
  path: "/roadmap",
  index: false,
});

export default function RoadmapPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: "/roadmap",
          title: `${PRODUCT.name} product roadmap`,
          description: ROADMAP_INTRO,
        })}
      />
      <Section className="py-12 sm:py-16" contentClassName="max-w-5xl">
        <PublicRoadmap />
      </Section>
    </>
  );
}
