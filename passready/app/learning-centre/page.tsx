import type { Metadata } from "next";

import { LearningCentrePageContent } from "@/components/marketing/LearningCentrePageContent";
import { PLATFORM_TERMS } from "@/lib/platform-copy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = buildPageMetadata({
  title: PLATFORM_TERMS.learningCentre,
  description:
    "Explore Pass Pilot modules: Test Ready Score, Coaching Tools, Teaching Diagrams, and upcoming Resources including Theory Hub and Driving Test Routes.",
  path: "/learning-centre",
});

export default async function LearningCentrePage() {
  await redirectIfAuthenticated();
  return <LearningCentrePageContent />;
}
