import { redirect } from "next/navigation";

import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { requireAuthenticatedSession } from "@/lib/server/require-authenticated-session";
import { getUserAppRole } from "@/lib/server/user-app-role";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthenticatedSession("/supervisor");

  const role = await getUserAppRole(user.id);
  if (role !== "parent") {
    redirect(dashboardPathForAppRole(role));
  }

  return <>{children}</>;
}
