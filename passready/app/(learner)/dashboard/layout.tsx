import { redirect } from "next/navigation";

import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { getServerAuthUser } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent("/dashboard")}`);
  }

  const role = await getUserAppRole(user.id);
  const destination = dashboardPathForAppRole(role);
  if (destination !== "/dashboard") {
    redirect(destination);
  }

  return <>{children}</>;
}
