import type { Metadata } from "next";

import { LearnerDashboardHome } from "@/components/dashboard/LearnerDashboardHome";
import { LearnerNotificationsPanel } from "@/components/learner/LearnerNotificationsPanel";
import { SITE } from "@/lib/constants";
import { buildLearnerDashboardView } from "@/lib/server/build-learner-dashboard-view";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `${SITE.name}: your Pass Pilot home, score, progress, and next steps.`,
};

export default async function LearnerDashboardPage() {
  const user = (await getServerAuthUser())!;
  const view = await buildLearnerDashboardView(user.id);

  return (
    <>
      <LearnerNotificationsPanel />
      <LearnerDashboardHome view={view} userId={user.id} />
    </>
  );
}
