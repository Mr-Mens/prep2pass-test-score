import { redirect } from "next/navigation";

import { getServerAuthUser } from "@/lib/supabase/server";

export default async function ReportsAccessLegacyRedirectPage() {
  const user = await getServerAuthUser();
  redirect(user?.emailConfirmedAt ? "/auth/resume" : "/login?next=%2Fauth%2Fresume");
}
