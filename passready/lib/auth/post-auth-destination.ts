import type { UserAppRole } from "@/lib/instructor/types";

export function dashboardPathForAppRole(role: UserAppRole): "/dashboard" | "/instructor" | "/supervisor" {
  if (role === "instructor") return "/instructor";
  if (role === "parent") return "/supervisor";
  return "/dashboard";
}
