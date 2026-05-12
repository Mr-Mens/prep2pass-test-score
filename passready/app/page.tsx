import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WelcomeLanding } from "@/components/welcome/WelcomeLanding";
import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Welcome · Test Ready Score",
  description:
    "Choose your path: learner, instructor, or parent. Test Ready Score helps UK drivers prepare for the practical test.",
};

export default async function WelcomeEntryPage() {
  const user = await getServerAuthUser();
  if (user?.emailConfirmedAt) {
    const role = await getUserAppRole(user.id);
    redirect(dashboardPathForAppRole(role));
  }

  return <WelcomeLanding />;
}
