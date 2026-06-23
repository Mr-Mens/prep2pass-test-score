import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

import { authResumePath } from "@/lib/auth/post-auth-destination";
import { selfServiceRoleFromSignupMetadata } from "@/lib/auth/self-service-roles";
import { autoAcceptPupilInviteByToken } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { ensureUserAppRoleFromIntent } from "@/lib/server/user-app-role";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/url";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function safeContinuePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

function destinationAfterAuth(user: { user_metadata?: Record<string, unknown> } | null): string {
  const continuePath = safeContinuePath(user?.user_metadata?.post_auth_continue);
  return continuePath ? authResumePath(continuePath) : "/auth/resume";
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
    if (error) authError = error;
  } else if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    if (error) authError = error;
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

  await assignInitialRoleFromSignupMetadata(
    user.id,
    user.user_metadata as Record<string, unknown> | undefined,
  );

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

  return redirectWithCookies(origin, destinationAfterAuth(user), pendingCookies);
}
