import { NextResponse } from "next/server";
import { z } from "zod";

import { ACCOUNT_STATUSES } from "@/lib/account/account-status";
import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import { handleAdminRouteError, jsonAdminError } from "@/lib/server/admin-route-errors";
import {
  deleteAdminUser,
  getAdminUserById,
  updateAdminUser,
} from "@/lib/server/repositories/admin-users-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

const patchUserSchema = z
  .object({
    role: z.enum(["learner", "instructor", "parent"]).optional(),
    accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
  })
  .refine((value) => value.role !== undefined || value.accountStatus !== undefined, {
    message: "Provide role and/or accountStatus to update.",
  });

type RouteContext = { params: { id: string } };

export async function GET(request: Request, context: RouteContext) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonAdminError(401, "UNAUTHORIZED", gate.message);
  if (!isSupabaseConfigured()) {
    return jsonAdminError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  try {
    const user = await getAdminUserById(context.params.id);
    if (!user) return jsonAdminError(404, "NOT_FOUND", "Account not found.");
    return NextResponse.json({ success: true as const, user });
  } catch (e) {
    return handleAdminRouteError(e, "Could not load account.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonAdminError(400, "VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid payload.");
  }

  try {
    const user = await updateAdminUser({
      userId: context.params.id,
      role: parsed.data.role,
      accountStatus: parsed.data.accountStatus,
    });
    return NextResponse.json({ success: true as const, user });
  } catch (e) {
    return handleAdminRouteError(e, "Could not update account.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonAdminError(401, "UNAUTHORIZED", gate.message);
  if (!isSupabaseConfigured()) {
    return jsonAdminError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  try {
    await deleteAdminUser(context.params.id);
    return NextResponse.json({ success: true as const });
  } catch (e) {
    return handleAdminRouteError(e, "Could not delete account.");
  }
}
