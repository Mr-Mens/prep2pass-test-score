import { redirect } from "next/navigation";

import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { getServerAuthUser } from "@/lib/supabase/server";

/** Canonical entry is `/`; `/welcome` is a bookmark-friendly alias. */
export default async function WelcomeAliasPage() {
  const user = await getServerAuthUser();
  if (user?.emailConfirmedAt) {
    redirect(dashboardPathForAppRole(await getUserAppRole(user.id)));
  }
  redirect("/");
}
