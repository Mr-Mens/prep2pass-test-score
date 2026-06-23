import { getPublicAppOrigin } from "@/lib/auth/public-app-origin";

import type { UserAppRole } from "@/lib/instructor/types";

export function dashboardPathForAppRole(role: UserAppRole): "/dashboard" | "/instructor" | "/supervisor" {
  if (role === "instructor") return "/instructor";
  if (role === "parent") return "/supervisor";
  return "/dashboard";
}

/** Post-auth routing after email confirm or password sign-in. */
export function authResumePath(continuePath?: string | null): string {
  if (
    typeof continuePath === "string" &&
    continuePath.startsWith("/") &&
    !continuePath.startsWith("//")
  ) {
    return `/auth/resume?continue=${encodeURIComponent(continuePath)}`;
  }
  return "/auth/resume";
}

/** Shown immediately after the user confirms their email — clear success before entering the app. */
export function authConfirmedPath(continuePath?: string | null): string {
  const q = new URLSearchParams();
  if (
    typeof continuePath === "string" &&
    continuePath.startsWith("/") &&
    !continuePath.startsWith("//")
  ) {
    q.set("continue", continuePath);
  }
  const query = q.toString();
  return query ? `/auth/confirmed?${query}` : "/auth/confirmed";
}

/** Must match Supabase Auth → URL configuration redirect allow list exactly (no query string). */
export function authCallbackRedirectUrl(origin?: string): string {
  const base = (origin ?? getPublicAppOrigin()).replace(/\/$/, "");
  return `${base}/auth/callback`;
}
