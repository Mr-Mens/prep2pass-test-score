import { NextResponse, type NextRequest } from "next/server";

import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { getServerAuthUser } from "@/lib/supabase/server";

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
 * Consolidated post-login destination: lifetime accounts default to `/dashboard`; others `/my-reports`.
 * Optional `continue` selects a verified internal path without opening redirects.
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
  let destination = "/my-reports";

  if (
    typeof continueRaw === "string" &&
    continueRaw.startsWith("/") &&
    !continueRaw.startsWith("//") &&
    !blockedContinue(continueRaw)
  ) {
    destination = continueRaw;
  } else {
    try {
      if (await getLifetimeAccessByUserId(user.id)) {
        destination = "/dashboard";
      }
    } catch {
      destination = "/my-reports";
    }
  }

  return redirect(origin, destination);
}
