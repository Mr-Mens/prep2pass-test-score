import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";
import { ROBOTS_PRIVATE } from "@/lib/seo/metadata";
import { getServerAuthUser } from "@/lib/supabase/server";

import { EmailConfirmedFlow } from "./EmailConfirmedFlow";

export const metadata: Metadata = {
  title: "Email verified",
  robots: ROBOTS_PRIVATE,
};

function ConfirmedLoading() {
  return (
    <div className="rounded-2xl border border-brand-200/90 bg-white p-10 text-center text-sm text-brand-600 shadow-card">
      Loading…
    </div>
  );
}

export default async function AuthConfirmedPage() {
  const user = await getServerAuthUser();

  return (
    <AuthScreenChrome>
      <Suspense fallback={<ConfirmedLoading />}>
        <EmailConfirmedFlow
          signedIn={Boolean(user)}
          email={user?.email ?? null}
          firstName={user?.firstName ?? null}
        />
      </Suspense>
    </AuthScreenChrome>
  );
}
