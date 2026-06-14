import type { Metadata } from "next";

import { GraduateFlow } from "@/components/learner/GraduateFlow";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Graduate Mode · Test Ready Score",
  description: "Record your practical test pass to stop billing and keep your reports.",
};

export default async function GraduatePage() {
  const user = (await getServerAuthUser())!;
  const access = await getLearnerAccessStatus(user.id);

  return (
    <div className="pb-4">
      <GraduateFlow isGraduated={access.isGraduated} passDate={access.passDate} />
    </div>
  );
}
