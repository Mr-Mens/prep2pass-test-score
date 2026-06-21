import type { Metadata } from "next";

import { LearnerResourcesContent } from "@/components/reflections/LearnerResourcesContent";
import { requireParentSession } from "@/lib/server/supervisor-page-auth";

export const metadata: Metadata = {
  title: "Resources · Parent supervisor",
  description: "Pass Pilot resources for parents and supervisors supporting private practice.",
};

export default async function SupervisorResourcesPage() {
  await requireParentSession();
  return <LearnerResourcesContent audience="supervisor" />;
}
