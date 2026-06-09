import type { UserAppRole } from "@/lib/instructor/types";

import { parseAppRole } from "@/lib/auth/role-from-destination";

/** Roles assignable without admin promotion. Instructor is never self-service. */
export const SELF_SERVICE_APP_ROLES = ["learner", "parent"] as const satisfies readonly UserAppRole[];

export type SelfServiceAppRole = (typeof SELF_SERVICE_APP_ROLES)[number];

export function isSelfServiceAppRole(value: UserAppRole): value is SelfServiceAppRole {
  return value === "learner" || value === "parent";
}

/**
 * Map signup metadata to a DB role. Instructor intent is stored in metadata only;
 * DB role stays learner until manually promoted (see .env.example).
 */
export function selfServiceRoleFromSignupMetadata(
  metadata: Record<string, unknown> | undefined,
): SelfServiceAppRole {
  const parsed = parseAppRole(metadata?.app_role);
  if (parsed === "parent") return "parent";
  return "learner";
}
