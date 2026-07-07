import "server-only";

import { redirect } from "next/navigation";

import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { redirectIfAccountPaused } from "@/lib/server/paused-account-guard";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export async function requireInstructorSession() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/instructor")}`);
  }
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent("/instructor")}`);
  }
  await redirectIfAccountPaused(user.id, "/instructor");
  const role = await getUserAppRole(user.id);
  if (role !== "instructor") {
    redirect(dashboardPathForAppRole(role));
  }
  return user;
}

export async function getInstructorProfileDisplay(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("instructor_profiles").select("*").eq("user_id", userId).maybeSingle();
  return data as
    | {
        user_id: string;
        display_name: string | null;
        adi_number_placeholder: string | null;
      }
    | null;
}
