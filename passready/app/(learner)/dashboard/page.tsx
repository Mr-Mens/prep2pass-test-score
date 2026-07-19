import type { Metadata } from "next";

import { LearnerDashboardHome } from "@/components/dashboard/LearnerDashboardHome";
import { LearnerNotificationsPanel } from "@/components/learner/LearnerNotificationsPanel";
import { SITE } from "@/lib/constants";
import { buildLearnerDashboardView } from "@/lib/server/build-learner-dashboard-view";
import { getCachedServerAuthUser } from "@/lib/server/cached-user-data";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `${SITE.name}: your Pass Pilot home, score, progress, and next steps.`,
};

type Props = {
  searchParams?: { premium?: string };
};

export default async function LearnerDashboardPage({ searchParams }: Props) {
  const user = (await getCachedServerAuthUser())!;
  const view = await buildLearnerDashboardView(user.id, user.firstName);
  const showGiftUnlock = searchParams?.premium === "gift";

  return (
    <>
      {showGiftUnlock ? (
        <div className="mb-4 rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-950">
          <p className="font-semibold">Premium unlocked</p>
          <p className="mt-1 text-teal-900/90">Your invite is active. You&apos;re all set — no payment needed.</p>
        </div>
      ) : null}
      <LearnerNotificationsPanel />
      <LearnerDashboardHome view={view} userId={user.id} />
    </>
  );
}
