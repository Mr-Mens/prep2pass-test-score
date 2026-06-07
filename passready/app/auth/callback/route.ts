import { NextResponse } from "next/server";

import { appRoleFromDestination } from "@/lib/auth/role-from-destination";
import { appRoleFromUserMetadata, ensureUserAppRoleFromIntent } from "@/lib/server/user-app-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { UserAppRole } from "@/lib/instructor/types";

async function syncRoleFromSignupIntent(userId: string, metadata: Record<string, unknown> | undefined, nextPath: string) {
  const intent =
    appRoleFromUserMetadata(metadata) ?? appRoleFromDestination(nextPath) ?? ("learner" satisfies UserAppRole);
  await ensureUserAppRoleFromIntent(userId, intent);
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
      await syncRoleFromSignupIntent(
        user.id,
        user.user_metadata as Record<string, unknown> | undefined,
        safeNext,
      );
    }
  }

  return NextResponse.redirect(new URL(safeNext, reqUrl.origin).toString());
}
