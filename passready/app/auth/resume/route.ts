import { NextResponse, type NextRequest } from "next/server";

import { detectLoginIntentMismatch, loginIntentRoleFromContinue } from "@/lib/auth/login-intent";
import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { resolvePostAuthDestination } from "@/lib/auth/resolve-post-auth-destination";
import { selfServiceRoleFromSignupMetadata } from "@/lib/auth/self-service-roles";
import {
  extractPremiumInviteToken,
  premiumInviteClaimPath,
  premiumInviteSubscribePath,
  redeemPremiumInviteForUser,
} from "@/lib/server/redeem-premium-invite";
import { getAdminPremiumInviteByToken, resolvePremiumInviteStatus } from "@/lib/server/repositories/admin-promo-repository";
import { syncUserProfileFromSignupMetadata } from "@/lib/server/repositories/user-profiles-repository";
import { redirectIfAccountPaused } from "@/lib/server/paused-account-guard";
import { ensureUserAppRoleFromIntent, getUserAppRole } from "@/lib/server/user-app-role";
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

  const continueRaw = request.nextUrl.searchParams.get("continue");
  const resumeContinuePath =
    typeof continueRaw === "string" && continueRaw.startsWith("/") && !continueRaw.startsWith("//")
      ? `/auth/resume?continue=${encodeURIComponent(continueRaw)}`
      : "/auth/resume";

  if (!user.emailConfirmedAt) {
    return redirect(origin, `/verify-email?next=${encodeURIComponent(resumeContinuePath)}`);
  }

  await redirectIfAccountPaused(user.id, continueRaw ?? undefined);

  try {
    await ensureUserAppRoleFromIntent(user.id, selfServiceRoleFromSignupMetadata(user.userMetadata));
  } catch (e) {
    console.warn("[auth/resume] role_assignment_failed", e);
  }

  void syncUserProfileFromSignupMetadata(user.id, user.userMetadata).catch((e) => {
    console.warn("[auth/resume] profile_sync_failed", e);
  });

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

  let destination = resolvePostAuthDestination(role, continueRaw);

  if (role === "learner" && user.email) {
    const inviteToken = extractPremiumInviteToken(
      continueRaw,
      user.userMetadata as Record<string, unknown> | undefined,
    );
    if (inviteToken) {
      try {
        const invite = await getAdminPremiumInviteByToken(inviteToken);
        if (invite && resolvePremiumInviteStatus(invite) === "pending") {
          if (invite.discount_percent >= 100) {
            const redeemed = await redeemPremiumInviteForUser({
              token: inviteToken,
              userId: user.id,
              email: user.email,
            });
            if (redeemed.ok) {
              destination = "/dashboard?premium=gift";
            } else if (redeemed.kind === "needs_checkout") {
              destination = premiumInviteSubscribePath(inviteToken);
            } else {
              destination = premiumInviteClaimPath(inviteToken);
            }
          } else {
            destination = premiumInviteSubscribePath(inviteToken);
          }
        } else if (invite && resolvePremiumInviteStatus(invite) === "redeemed") {
          destination = "/dashboard";
        }
      } catch (e) {
        console.warn("[auth/resume] premium_invite_redeem_failed", e);
        destination = premiumInviteClaimPath(inviteToken);
      }
    }
  }

  return redirect(origin, destination);
}
