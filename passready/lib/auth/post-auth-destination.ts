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

/** Must match Supabase Auth → URL configuration redirect allow list exactly (no query string). */
export function authCallbackRedirectUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}
