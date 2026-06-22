import "server-only";

import { normalizeEmail } from "@/lib/normalize-email";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { resolveServerAuthUser } from "@/lib/supabase/server";

export type RouteAuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; message: string };

/** Cookie-backed caller context for authenticated API routes only. */
export async function requireVerifiedApiUser(): Promise<RouteAuthResult> {
  try {
    const user = await resolveServerAuthUser();
    if (!user) {
      return {
        ok: false,
        status: 401,
        message: "Please sign in to continue.",
      };
    }
    if (!user.emailConfirmedAt) {
      return {
        ok: false,
        status: 403,
        message: "Please verify your email to continue.",
      };
    }

    return { ok: true, userId: user.id, email: normalizeEmail(user.email) };
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

export async function requireParentApiUser(): Promise<RouteAuthResult> {
  const base = await requireVerifiedApiUser();
  if (!base.ok) return base;
  const role = await getUserAppRole(base.userId);
  if (role !== "parent") {
    return { ok: false, status: 403, message: "Parent supervisor access only." };
  }
  return base;
}

export async function requireLearnerApiUser(): Promise<RouteAuthResult> {
  const base = await requireVerifiedApiUser();
  if (!base.ok) return base;
  const role = await getUserAppRole(base.userId);
  if (role !== "learner") {
    return { ok: false, status: 403, message: "Learner access only." };
  }
  return base;
}
