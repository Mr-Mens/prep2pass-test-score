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
  return (
    (typeof meta?.first_name === "string" && meta.first_name.trim()) ||
    (typeof meta?.firstName === "string" && meta.firstName.trim()) ||
    ""
  );
}

export const getServerAuthUser = cache(async (): Promise<ServerAuthUser | null> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || !user.email) return null;
  return {
    id: user.id,
    email: user.email.trim().toLowerCase(),
    emailConfirmedAt: user.email_confirmed_at ?? null,
    firstName: firstNameFromMetadata(user.user_metadata as Record<string, unknown> | undefined),
  };
});
