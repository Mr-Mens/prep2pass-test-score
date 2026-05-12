import { NextResponse, type NextRequest } from "next/server";

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
 * Post-login destination for verified learners defaults to `/dashboard`.
 * Optional `continue` selects a verified internal path.
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
  let destination = "/dashboard";

  if (
    typeof continueRaw === "string" &&
    continueRaw.startsWith("/") &&
    !continueRaw.startsWith("//") &&
    !blockedContinue(continueRaw)
  ) {
    destination = continueRaw;
  }

  return redirect(origin, destination);
}
