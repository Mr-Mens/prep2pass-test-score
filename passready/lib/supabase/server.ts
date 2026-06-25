import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

import { getSupabaseAnonKey, getSupabaseUrl } from "./url";

/**
 * Next.js Server Components / Route Handlers: cookie-backed Supabase session.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* set from Server Components can throw; middleware refresh handles writes */
        }
      },
    },
  });
}

export type ServerAuthUser = {
  id: string;
  email: string;
  /** ISO timestamp when email was confirmed */
  emailConfirmedAt: string | null;
  firstName: string;
};

function firstNameFromMetadata(meta: Record<string, unknown> | undefined): string {
  const full =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.fullName === "string" && meta.fullName.trim()) ||
    "";
  if (full) return full.split(/\s+/)[0] ?? full;
  return (
    (typeof meta?.first_name === "string" && meta.first_name.trim()) ||
    (typeof meta?.firstName === "string" && meta.firstName.trim()) ||
    ""
  );
}

function mapServerAuthUser(user: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}): ServerAuthUser | null {
  if (!user.id || !user.email?.trim()) return null;
  return {
    id: user.id,
    email: user.email.trim().toLowerCase(),
    emailConfirmedAt: user.email_confirmed_at ?? null,
    firstName: firstNameFromMetadata(user.user_metadata),
  };
}

/** Resolves the signed-in user, refreshing the cookie session when needed (no Edge middleware). */
export async function resolveServerAuthUser(): Promise<ServerAuthUser | null> {
  const supabase = createSupabaseServerClient();
  const first = await supabase.auth.getUser();
  if (first.data.user) return mapServerAuthUser(first.data.user);

  const session = await supabase.auth.getSession();
  if (!session.data.session) return null;

  const refreshed = await supabase.auth.refreshSession();
  const user = refreshed.data.user ?? session.data.session.user;
  return mapServerAuthUser(user);
}

export const getServerAuthUser = cache(async (): Promise<ServerAuthUser | null> => {
  return resolveServerAuthUser();
});
