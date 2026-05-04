import { NextResponse } from "next/server";

import { getEntitlementLookup } from "@/lib/server/repositories/entitlements-repository";
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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "Request body must be valid JSON");
    }

    const parsed = entitlementLookupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid email");
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true as const,
        hasLifetimeAccess: false,
        hasPurchasedSingleReport: false,
        reportCount: 0,
      });
    }

    const summary = await getEntitlementLookup(parsed.data.email);
    return NextResponse.json({ success: true as const, ...summary });
  } catch (e) {
    console.error("[entitlements:lookup]", e);
    return jsonError(500, "INTERNAL_ERROR", "Unable to look up entitlements");
  }
}
