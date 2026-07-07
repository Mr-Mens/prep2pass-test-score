import { NextResponse } from "next/server";
import { z } from "zod";

import { ACCOUNT_STATUSES } from "@/lib/account/account-status";
import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import { handleAdminRouteError, jsonAdminError } from "@/lib/server/admin-route-errors";
import { isAccountStatusModuleReady } from "@/lib/server/account-status";
import { createAdminUser, listAdminUsers } from "@/lib/server/repositories/admin-users-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  query: z.string().trim().max(120).optional(),
  role: z.enum(["all", "learner", "instructor", "parent"]).optional(),
  accountStatus: z.enum(["all", ...ACCOUNT_STATUSES]).optional(),
});

const createUserSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
  role: z.enum(["learner", "instructor", "parent"]),
  fullName: z.string().trim().max(120).optional(),
});

export async function GET(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonAdminError(401, "UNAUTHORIZED", gate.message);
  if (!isSupabaseConfigured()) {
    return jsonAdminError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const url = new URL(request.url);
  const parsed = listQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    perPage: url.searchParams.get("perPage") ?? undefined,
    query: url.searchParams.get("query") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    accountStatus: url.searchParams.get("accountStatus") ?? undefined,
  });

  if (!parsed.success) {
    return jsonAdminError(400, "VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid query.");
  }

  try {
    const migrationRequired = !(await isAccountStatusModuleReady());
    const result = await listAdminUsers({
      page: parsed.data.page,
      perPage: parsed.data.perPage,
      query: parsed.data.query,
      role: parsed.data.role ?? "all",
      accountStatus: parsed.data.accountStatus ?? "all",
    });

    return NextResponse.json({
      success: true as const,
      migrationRequired,
      hint: migrationRequired
        ? "Run supabase/migrations/024_user_account_status.sql to enable pause and reinstate."
        : undefined,
      users: result.users,
      page: result.page,
      perPage: result.perPage,
      hasMore: result.hasMore,
    });
  } catch (e) {
    return handleAdminRouteError(e, "Could not load accounts.");
  }
}

export async function POST(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonAdminError(401, "UNAUTHORIZED", gate.message);
  if (!isSupabaseConfigured()) {
    return jsonAdminError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonAdminError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonAdminError(400, "VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid payload.");
  }

  try {
    const user = await createAdminUser(parsed.data);
    return NextResponse.json({ success: true as const, user });
  } catch (e) {
    return handleAdminRouteError(e, "Could not create account.");
  }
}
