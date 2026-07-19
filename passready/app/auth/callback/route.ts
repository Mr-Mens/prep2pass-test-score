import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

import { authResumePath } from "@/lib/auth/post-auth-destination";
import { selfServiceRoleFromSignupMetadata } from "@/lib/auth/self-service-roles";
import { premiumInviteClaimPath } from "@/lib/server/redeem-premium-invite";
import { autoAcceptPupilInviteByToken } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { syncUserProfileFromSignupMetadata } from "@/lib/server/repositories/user-profiles-repository";
import { ensureUserAppRoleFromIntent } from "@/lib/server/user-app-role";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/url";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function safeContinuePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

function destinationAfterSignupConfirm(user: { user_metadata?: Record<string, unknown> } | null): string {
  let continuePath = safeContinuePath(user?.user_metadata?.post_auth_continue);
  const pendingPremium =
    typeof user?.user_metadata?.pending_premium_invite_token === "string"
      ? user.user_metadata.pending_premium_invite_token.trim()
      : "";

  if (pendingPremium) {
    const encoded = encodeURIComponent(pendingPremium);
    const hasInvite =
      Boolean(continuePath?.includes(`premiumInvite=${encoded}`)) ||
      Boolean(continuePath?.includes(`premiumInvite=${pendingPremium}`)) ||
      Boolean(continuePath?.includes(`/invite/premium/${pendingPremium}`)) ||
      Boolean(continuePath?.includes(`/invite/premium/${encoded}`));
    if (!hasInvite) {
      continuePath = premiumInviteClaimPath(pendingPremium);
    }
  }

  return authResumePath(continuePath);
}

function parseOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  const allowed: EmailOtpType[] = [
    "signup",
    "email",
    "recovery",
    "invite",
    "magiclink",
    "email_change",
    "email_change_new",
    "email_change_current",
  ];
  return allowed.includes(raw as EmailOtpType) ? (raw as EmailOtpType) : null;
}

function redirectWithCookies(origin: string, path: string, cookiesToSet: PendingCookie[]) {
  const response = NextResponse.redirect(new URL(path, origin));
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

async function verifyOtpWithFallback(
  supabase: ReturnType<typeof createServerClient>,
  tokenHash: string,
  otpType: EmailOtpType,
): Promise<Error | null> {
  const attempts: EmailOtpType[] = [otpType];
  if (otpType === "signup") attempts.push("email");
  if (otpType === "email") attempts.push("signup");

  let lastError: Error | null = null;
  for (const type of attempts) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return null;
    lastError = error;
  }
  return lastError;
}

/** First email confirmation after signup, assign self-service role from signup metadata only. */
async function assignInitialRoleFromSignupMetadata(
  userId: string,
  metadata: Record<string, unknown> | undefined,
) {
  const role = selfServiceRoleFromSignupMetadata(metadata);
  await ensureUserAppRoleFromIntent(userId, role);
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = parseOtpType(requestUrl.searchParams.get("type"));
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => pendingCookies.push(cookie));
      },
    },
  });

  if (!code && !(tokenHash && otpType)) {
    console.error("[auth/callback] missing_code_or_token", requestUrl.search);
    return redirectWithCookies(origin, "/verify-email?error=callback", pendingCookies);
  }

  let authError: Error | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash && otpType) {
    authError = await verifyOtpWithFallback(supabase, tokenHash, otpType);
  }

  if (authError) {
    console.error("[auth/callback] session_exchange_failed", authError.message);
    return redirectWithCookies(origin, "/verify-email?error=callback", pendingCookies);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    console.error("[auth/callback] no_user_after_exchange");
    return redirectWithCookies(origin, "/verify-email?error=callback", pendingCookies);
  }

  if (otpType === "recovery") {
    return redirectWithCookies(origin, "/reset-password", pendingCookies);
  }

  await assignInitialRoleFromSignupMetadata(
    user.id,
    user.user_metadata as Record<string, unknown> | undefined,
  );

  try {
    await syncUserProfileFromSignupMetadata(
      user.id,
      user.user_metadata as Record<string, unknown> | undefined,
    );
  } catch (e) {
    console.error("[auth/callback] profile_sync_failed", e);
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const inviteToken = typeof meta?.pending_invite_token === "string" ? meta.pending_invite_token.trim() : "";
  if (inviteToken && user.email) {
    try {
      await autoAcceptPupilInviteByToken({
        inviteToken,
        learnerUserId: user.id,
        learnerEmail: user.email,
      });
    } catch (e) {
      console.error("[auth/callback] invite_auto_link_failed", e);
    }
  }

  return redirectWithCookies(origin, destinationAfterSignupConfirm(user), pendingCookies);
}
