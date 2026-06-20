import { NextResponse } from "next/server";

import { PROMO_MIGRATION_HINT } from "@/lib/server/commercial-schema";

export function jsonAdminError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export function handleAdminPromoRouteError(e: unknown, fallbackMessage: string) {
  if (e instanceof Error) {
    if (e.message === "PROMO_MIGRATION_REQUIRED") {
      return jsonAdminError(503, "MIGRATION_REQUIRED", PROMO_MIGRATION_HINT);
    }
    if (e.message === "SUPABASE_UNREACHABLE") {
      return jsonAdminError(
        503,
        "SUPABASE_UNREACHABLE",
        "Could not connect to Supabase. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, and ensure your Supabase project is active (not paused).",
      );
    }
  }
  console.error("[admin-promo-route]", e);
  return jsonAdminError(500, "INTERNAL_ERROR", fallbackMessage);
}
