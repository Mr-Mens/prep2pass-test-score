import { NextResponse } from "next/server";

import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { getUserAppRole } from "@/lib/server/user-app-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseClientEnvConfigured } from "@/lib/supabase/url";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  if (!isSupabaseClientEnvConfigured()) {
    return NextResponse.json({ user: null }, noStore);
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email?.trim()) {
      return NextResponse.json({ user: null }, noStore);
    }

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const firstName =
      (typeof meta?.first_name === "string" && meta.first_name.trim()) ||
      (typeof meta?.firstName === "string" && meta.firstName.trim()) ||
      "";

    let lifetimeAccess = false;
    try {
      lifetimeAccess = await getLifetimeAccessByUserId(user.id);
    } catch {
      lifetimeAccess = false;
    }

    const role = await getUserAppRole(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email.trim().toLowerCase(),
          emailConfirmedAt: user.email_confirmed_at ?? null,
          firstName,
          lifetimeAccess,
          role,
        },
      },
      noStore,
    );
  } catch {
    console.error("[api/auth/me] session read failed");
    return NextResponse.json({ user: null, error: "Unable to read session." }, { status: 500, ...noStore });
  }
}
