import { NextResponse } from "next/server";

import { handleSupabaseSendEmailHook } from "@/lib/email/supabase-auth-hook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await handleSupabaseSendEmailHook(request);

  if (!result.ok) {
    return NextResponse.json(
      { error: { message: result.message } },
      { status: result.status },
    );
  }

  return NextResponse.json({});
}

export async function GET() {
  return NextResponse.json({ error: { message: "Method not allowed" } }, { status: 405 });
}
