import "server-only";

import { redirect } from "next/navigation";

import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { getServerAuthUser } from "@/lib/supabase/server";

/** Send verified signed-in users to their role workspace (never marketing). */
export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getServerAuthUser();
  if (!user?.emailConfirmedAt) return;
  const role = await getUserAppRole(user.id);
  redirect(dashboardPathForAppRole(role));
}
