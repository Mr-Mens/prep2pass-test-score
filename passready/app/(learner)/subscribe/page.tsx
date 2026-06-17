import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SubscribeFlow } from "@/components/SubscribeFlow";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Subscribe · Pass Pilot",
  description: "£6.99/month for unlimited assessments, AI reports, and progress tracking.",
};

export default async function SubscribePage() {
  const user = (await getServerAuthUser())!;
  const access = await getLearnerAccessStatus(user.id);
  if (access.hasPremiumAccess) redirect("/dashboard");
  if (access.isGraduated) redirect("/graduate");

  return (
    <div className="pb-4">
      <SubscribeFlow />
    </div>
  );
}
