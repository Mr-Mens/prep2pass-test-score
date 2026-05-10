import "server-only";

import { normalizeEmail } from "@/lib/normalize-email";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RouteAuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; message: string };

/** Cookie-backed caller context for authenticated API routes only. */
export async function requireVerifiedApiUser(): Promise<RouteAuthResult> {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user?.id || !user.email?.trim()) {
      return {
        ok: false,
        status: 401,
        message: "Please sign in to continue.",
      };
    }
    if (!user.email_confirmed_at) {
      return {
        ok: false,
        status: 403,
        message: "Please verify your email to continue.",
      };
    }

    const email = normalizeEmail(user.email);

    return { ok: true, userId: user.id, email };
  } catch {
    return { ok: false, status: 500, message: "Authentication failed. Try again shortly." };
  }
}

export async function requireInstructorApiUser(): Promise<RouteAuthResult> {
  const base = await requireVerifiedApiUser();
  if (!base.ok) return base;
  const role = await getUserAppRole(base.userId);
  if (role !== "instructor") {
    return { ok: false, status: 403, message: "Instructor access only." };
  }
  return base;
}
