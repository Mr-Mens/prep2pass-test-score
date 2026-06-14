import { NextResponse } from "next/server";

import { selfServiceRoleFromSignupMetadata } from "@/lib/auth/self-service-roles";
import { autoAcceptPupilInviteByToken } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { ensureUserAppRoleFromIntent } from "@/lib/server/user-app-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** First email confirmation after signup, assign self-service role from signup metadata only. */
async function assignInitialRoleFromSignupMetadata(
  userId: string,
  metadata: Record<string, unknown> | undefined,
) {
  const role = selfServiceRoleFromSignupMetadata(metadata);
  await ensureUserAppRoleFromIntent(userId, role);
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get("code");
  const safeNextRaw = reqUrl.searchParams.get("next") ?? "/auth/resume";
  const safeNext =
    safeNextRaw.startsWith("/") && !safeNextRaw.startsWith("//") ? safeNextRaw : "/auth/resume";

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      await assignInitialRoleFromSignupMetadata(
        user.id,
        user.user_metadata as Record<string, unknown> | undefined,
      );
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const inviteToken =
        typeof meta?.pending_invite_token === "string" ? meta.pending_invite_token.trim() : "";
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
    }
  }

  return NextResponse.redirect(new URL(safeNext, reqUrl.origin).toString());
}
