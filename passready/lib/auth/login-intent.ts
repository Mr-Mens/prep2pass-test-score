import { appRoleFromDestination } from "@/lib/auth/role-from-destination";
import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";

import type { UserAppRole } from "@/lib/instructor/types";

export const ROLE_SIGN_IN_LABEL: Record<UserAppRole, string> = {
  learner: "Learner",
  instructor: "Instructor",
  parent: "Parent / Supervisor",
};

export type LoginIntentMismatch = {
  accountRole: UserAppRole;
  attemptedRole: UserAppRole;
  correctLoginPath: string;
};

/** Sign-in must start from welcome with a role-specific destination (`/dashboard`, `/instructor`, `/supervisor`). */
export function loginIntentRoleFromContinue(continueRaw: string | null): UserAppRole | null {
  if (!continueRaw) return null;
  return appRoleFromDestination(continueRaw);
}

export function loginPathForRole(role: UserAppRole): string {
  return `/login?next=${encodeURIComponent(dashboardPathForAppRole(role))}`;
}

export function roleMismatchMessage(attemptedRole: UserAppRole): string {
  if (attemptedRole === "learner") return "This email doesn't match a learner account.";
  if (attemptedRole === "instructor") return "This email doesn't match an instructor account.";
  return "This email doesn't match a parent account.";
}

export function otherSignInRoles(current: UserAppRole): UserAppRole[] {
  const all: UserAppRole[] = ["learner", "instructor", "parent"];
  return all.filter((role) => role !== current);
}

export function detectLoginIntentMismatch(
  continueRaw: string | null,
  accountRole: UserAppRole,
): LoginIntentMismatch | null {
  const attemptedRole = loginIntentRoleFromContinue(continueRaw);
  if (!attemptedRole || attemptedRole === accountRole) return null;
  return {
    accountRole,
    attemptedRole,
    correctLoginPath: loginPathForRole(accountRole),
  };
}
