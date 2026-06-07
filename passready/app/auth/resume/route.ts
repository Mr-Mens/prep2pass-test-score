import { NextResponse, type NextRequest } from "next/server";

import { appRoleFromDestination, destinationAllowedForRole } from "@/lib/auth/role-from-destination";
import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { appRoleFromUserMetadata, ensureUserAppRoleFromIntent, getUserAppRole } from "@/lib/server/user-app-role";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

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

function redirect(origin: string, path: string) {
  return NextResponse.redirect(new URL(path, origin).toString());
}

/**
 * Post-login destination defaults to the role dashboard.
 * Optional `continue` selects a verified internal path when it matches the user's role.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const user = await getServerAuthUser();

  if (!user) {
    return redirect(origin, `/login?next=${encodeURIComponent("/auth/resume")}`);
  }

  if (!user.emailConfirmedAt) {
    return redirect(origin, `/verify-email?next=${encodeURIComponent("/auth/resume")}`);
  }

  const continueRaw = request.nextUrl.searchParams.get("continue");
  const supabase = createSupabaseServerClient();
  const {
    data: { user: rawUser },
  } = await supabase.auth.getUser();
  const metadata = rawUser?.user_metadata as Record<string, unknown> | undefined;

  const intentFromContinue = continueRaw ? appRoleFromDestination(continueRaw) : null;
  const intent: UserAppRole =
    intentFromContinue ?? appRoleFromUserMetadata(metadata) ?? "learner";

  await ensureUserAppRoleFromIntent(user.id, intent);
  const role = await getUserAppRole(user.id);
  let destination: string = dashboardPathForAppRole(role);

  if (
    typeof continueRaw === "string" &&
    continueRaw.startsWith("/") &&
    !continueRaw.startsWith("//") &&
    !blockedContinue(continueRaw) &&
    destinationAllowedForRole(continueRaw, role)
  ) {
    destination = continueRaw;
  }

  return redirect(origin, destination);
}
