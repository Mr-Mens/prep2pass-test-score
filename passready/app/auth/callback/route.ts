import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get("code");
  const safeNextRaw = reqUrl.searchParams.get("next") ?? "/auth/resume";
  const safeNext =
    safeNextRaw.startsWith("/") && !safeNextRaw.startsWith("//") ? safeNextRaw : "/auth/resume";

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(safeNext, reqUrl.origin).toString());
}
