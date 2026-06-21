import type { Metadata } from "next";

import { LearnerResourcesContent } from "@/components/reflections/LearnerResourcesContent";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Resources",
  description: `${SITE.name} learning resources, guides, and coaching tools.`,
};

export default function LearnerResourcesPage() {
  return <LearnerResourcesContent />;
}
