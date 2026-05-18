import "server-only";

import { redirect } from "next/navigation";

import { getServerAuthUser, type ServerAuthUser } from "@/lib/supabase/server";

/** Server-side session gate for protected pages and layouts (replaces Edge middleware). */
export async function requireAuthenticatedSession(returnPath: string): Promise<ServerAuthUser> {
  const user = await getServerAuthUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent(returnPath)}`);
  }
  return user;
}
