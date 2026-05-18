import { redirect } from "next/navigation";

import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { getServerAuthUser } from "@/lib/supabase/server";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/supervisor")}`);
  }
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?continue=${encodeURIComponent("/supervisor")}`);
  }

  const role = await getUserAppRole(user.id);
  if (role !== "parent") {
    redirect(dashboardPathForAppRole(role));
  }

  return <>{children}</>;
}
