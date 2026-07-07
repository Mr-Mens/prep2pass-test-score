import { NextResponse } from "next/server";

import { ACCOUNT_STATUS_MIGRATION_HINT } from "@/lib/server/account-status";

export function jsonAdminError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export function handleAdminRouteError(e: unknown, fallbackMessage: string) {
  if (e instanceof Error) {
    if (e.message === "ACCOUNT_STATUS_MIGRATION_REQUIRED") {
      return jsonAdminError(503, "MIGRATION_REQUIRED", ACCOUNT_STATUS_MIGRATION_HINT);
    }
    if (e.message === "SUPABASE_UNREACHABLE") {
      return jsonAdminError(
        503,
        "SUPABASE_UNREACHABLE",
        "Could not connect to Supabase. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, and ensure your Supabase project is active (not paused).",
      );
    }
    if (e.message === "An account with this email already exists.") {
      return jsonAdminError(409, "DUPLICATE_EMAIL", e.message);
    }
    if (e.message === "Account not found.") {
      return jsonAdminError(404, "NOT_FOUND", e.message);
    }
  }
  console.error("[admin-route]", e);
  return jsonAdminError(500, "INTERNAL_ERROR", fallbackMessage);
}
