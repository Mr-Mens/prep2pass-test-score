import "server-only";

import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { getUserAppRole } from "@/lib/server/user-app-role";

/**
 * Stored lifetime entitlement, or complementary premium access for instructor accounts.
 */
export async function getEffectiveLifetimeAccessByUserId(userId: string): Promise<boolean> {
  const [storedResult, roleResult] = await Promise.allSettled([
    getLifetimeAccessByUserId(userId),
    getUserAppRole(userId),
  ]);

  const stored = storedResult.status === "fulfilled" && storedResult.value;
  if (stored) return true;

  const role = roleResult.status === "fulfilled" ? roleResult.value : "learner";
  return role === "instructor";
}
