import { redirect } from "next/navigation";

import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { requirePremiumLearnerAccess } from "@/lib/server/require-premium-learner-access";
import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";
import { getUserAppRole } from "@/lib/server/user-app-role";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthenticatedSession("/dashboard");

  const role = await getUserAppRole(user.id);
  const destination = dashboardPathForAppRole(role);
  if (destination !== "/dashboard") {
    redirect(destination);
  }

  await requirePremiumLearnerAccess("/dashboard");

  return <>{children}</>;
}
