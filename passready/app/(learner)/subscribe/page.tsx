import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SubscribeFlow } from "@/components/SubscribeFlow";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Subscribe · Pass Pilot",
  description: `£6.99/month for unlimited assessments, Smart Reports, and progress tracking.`,
};

function SubscribeLoading() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600 shadow-card">
      Loading…
    </div>
  );
}

export default async function SubscribePage() {
  const user = (await getServerAuthUser())!;
  const access = await getLearnerAccessStatus(user.id);
  if (access.hasPremiumAccess) redirect("/dashboard");
  if (access.isGraduated) redirect("/graduate");

  return (
    <div className="pb-4">
      <Suspense fallback={<SubscribeLoading />}>
        <SubscribeFlow />
      </Suspense>
    </div>
  );
}
