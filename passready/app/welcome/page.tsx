import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { WelcomeLanding } from "@/components/welcome/WelcomeLanding";
import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in · Pass Pilot",
  description: "Choose your path: learner, instructor, or parent.",
};

function WelcomeLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 text-sm text-brand-600">
      Loading…
    </div>
  );
}

export default async function WelcomePage() {
  const user = await getServerAuthUser();
  if (user?.emailConfirmedAt) {
    const role = await getUserAppRole(user.id);
    redirect(dashboardPathForAppRole(role));
  }

  return (
    <Suspense fallback={<WelcomeLoading />}>
      <WelcomeLanding />
    </Suspense>
  );
}
