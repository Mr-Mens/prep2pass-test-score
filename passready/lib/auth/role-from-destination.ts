import type { UserAppRole } from "@/lib/instructor/types";

const ROLE_DESTINATIONS: ReadonlyArray<{ prefix: string; role: UserAppRole }> = [
  { prefix: "/instructor", role: "instructor" },
  { prefix: "/supervisor", role: "parent" },
  { prefix: "/dashboard", role: "learner" },
  { prefix: "/assessment", role: "learner" },
  { prefix: "/subscribe", role: "learner" },
  { prefix: "/invite", role: "learner" },
  { prefix: "/mock-tests", role: "learner" },
  { prefix: "/progress", role: "learner" },
  { prefix: "/account", role: "learner" },
  { prefix: "/my-reports", role: "learner" },
  { prefix: "/reports", role: "learner" },
  { prefix: "/lifetime", role: "learner" },
  { prefix: "/graduate", role: "learner" },
  { prefix: "/upgrade", role: "learner" },
  { prefix: "/results", role: "learner" },
  { prefix: "/home", role: "learner" },
  { prefix: "/checkout", role: "learner" },
];

export function parseAppRole(value: unknown): UserAppRole | null {
  if (value === "learner" || value === "instructor" || value === "parent") return value;
  return null;
}

/** Map a post-auth path (from welcome / login `next`) to an app role, if unambiguous. */
export function appRoleFromDestination(path: string): UserAppRole | null {
  const normalized = path.split("?")[0] ?? path;
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return null;

  for (const { prefix, role } of ROLE_DESTINATIONS) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) return role;
  }
  return null;
}

export function destinationAllowedForRole(path: string, role: UserAppRole): boolean {
  const required = appRoleFromDestination(path);
  return !required || required === role;
}
