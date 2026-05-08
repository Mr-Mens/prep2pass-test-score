import { NextResponse } from "next/server";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { getEntitlementLookupForUser } from "@/lib/server/repositories/entitlements-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { entitlementLookupRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  return jsonError(405, "METHOD_NOT_ALLOWED", "Only POST is supported");
}

export async function POST(request: Request) {
  try {
    const auth = await requireVerifiedApiUser();
    if (!auth.ok) {
      return jsonError(auth.status, "AUTH_REQUIRED", auth.message);
    }

    try {
      const body = await request.json();
      entitlementLookupRequestSchema.parse(body ?? {});
    } catch {
      return jsonError(400, "VALIDATION_ERROR", "Invalid request shape");
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true as const,
        hasLifetimeAccess: false,
        hasPurchasedSingleReport: false,
        reportCount: 0,
      });
    }

    const summary = await getEntitlementLookupForUser(auth.userId);
    return NextResponse.json({ success: true as const, ...summary });
  } catch (e) {
    console.error("[entitlements:lookup]", e);
    return jsonError(500, "INTERNAL_ERROR", "Unable to look up entitlements");
  }
}
