import type { UserAppRole } from "@/lib/instructor/types";

import { parseAppRole } from "@/lib/auth/role-from-destination";

/** Roles assignable on self-service signup (welcome → signup flow). */
export const SELF_SERVICE_APP_ROLES = ["learner", "instructor", "parent"] as const satisfies readonly UserAppRole[];

export type SelfServiceAppRole = (typeof SELF_SERVICE_APP_ROLES)[number];

export function isSelfServiceAppRole(value: UserAppRole): value is SelfServiceAppRole {
  return value === "learner" || value === "instructor" || value === "parent";
}

/** Map signup metadata to the persisted DB role. */
export function selfServiceRoleFromSignupMetadata(
  metadata: Record<string, unknown> | undefined,
): SelfServiceAppRole {
  const parsed = parseAppRole(metadata?.app_role);
  if (parsed === "instructor") return "instructor";
  if (parsed === "parent") return "parent";
  return "learner";
}
