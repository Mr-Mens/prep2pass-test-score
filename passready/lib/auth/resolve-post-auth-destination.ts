import { destinationAllowedForRole } from "@/lib/auth/role-from-destination";
import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";

import type { UserAppRole } from "@/lib/instructor/types";

const BLOCKED_CONTINUE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth/resume",
  "/auth/callback",
] as const;

function blockedContinue(path: string): boolean {
  return BLOCKED_CONTINUE_PREFIXES.some((p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`));
}

/**
 * Post-login routing is driven only by the persisted DB role, never by URL alone.
 * Optional `continue` is honoured only when it matches that role.
 */
export function resolvePostAuthDestination(role: UserAppRole, continueRaw: string | null): string {
  const home = dashboardPathForAppRole(role);

  if (
    typeof continueRaw === "string" &&
    continueRaw.startsWith("/") &&
    !continueRaw.startsWith("//") &&
    !blockedContinue(continueRaw) &&
    destinationAllowedForRole(continueRaw, role)
  ) {
    return continueRaw;
  }

  return home;
}
