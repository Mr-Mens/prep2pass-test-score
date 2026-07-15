import { NextResponse } from "next/server";

import { requireLearnerApiUser } from "@/lib/server/api-auth";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/server/web-push";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireLearnerApiUser();
  if (!auth.ok) {
    return NextResponse.json({ success: false as const, error: { code: "AUTH", message: auth.message } }, { status: auth.status });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json({ success: true as const, publicKey: null, configured: false });
  }

  return NextResponse.json({
    success: true as const,
    publicKey: getVapidPublicKey(),
    configured: true,
  });
}
