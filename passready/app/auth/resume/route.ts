import { NextResponse, type NextRequest } from "next/server";

import { detectLoginIntentMismatch, loginIntentRoleFromContinue } from "@/lib/auth/login-intent";
import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { resolvePostAuthDestination } from "@/lib/auth/resolve-post-auth-destination";
import { syncUserProfileFromSignupMetadata } from "@/lib/server/repositories/user-profiles-repository";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

function redirect(origin: string, path: string) {
  return NextResponse.redirect(new URL(path, origin).toString());
}

/**
 * Post-login routing uses the persisted DB role only.
 * If the welcome sign-in path (learner / instructor / parent) does not match the account role,
 * the session is cleared and the user must sign in via the correct button.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const user = await getServerAuthUser();

  if (!user) {
    const continueRaw = request.nextUrl.searchParams.get("continue");
    const q = new URLSearchParams();
    if (
      typeof continueRaw === "string" &&
      continueRaw.startsWith("/") &&
      !continueRaw.startsWith("//")
    ) {
      q.set("next", continueRaw);
    }
    const query = q.toString();
    return redirect(origin, query ? `/login?${query}` : "/login");
  }

  if (!user.emailConfirmedAt) {
    return redirect(origin, `/verify-email?next=${encodeURIComponent("/auth/resume")}`);
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user: raw },
    } = await supabase.auth.getUser();
    await syncUserProfileFromSignupMetadata(
      user.id,
      raw?.user_metadata as Record<string, unknown> | undefined,
    );
  } catch (e) {
    console.warn("[auth/resume] profile_sync_failed", e);
  }

  const continueRaw = request.nextUrl.searchParams.get("continue");
  const role = await getUserAppRole(user.id);
  const intent = loginIntentRoleFromContinue(continueRaw);

  if (!intent) {
    return redirect(origin, resolvePostAuthDestination(role, null));
  }

  const mismatch = detectLoginIntentMismatch(continueRaw, role);

  if (mismatch) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    const q = new URLSearchParams({
      error: "role_mismatch",
      attempted: mismatch.attemptedRole,
      next: dashboardPathForAppRole(mismatch.attemptedRole),
    });
    return redirect(origin, `/login?${q.toString()}`);
  }

  const destination = resolvePostAuthDestination(role, continueRaw);
  return redirect(origin, destination);
}
