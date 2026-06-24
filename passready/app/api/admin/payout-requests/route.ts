import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import {
  listAllPayoutRequestsForAdmin,
  updatePayoutRequestStatus,
} from "@/lib/server/repositories/instructor-commissions-repository";

export const runtime = "nodejs";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["requested", "approved", "paid", "rejected"]),
  notes: z.string().trim().max(500).optional(),
});

function jsonError(status: number, message: string) {
  return NextResponse.json({ success: false as const, error: { message } }, { status });
}

export async function GET(request: Request) {
  try {
    assertAdminAccess(getAdminKeyFromRequest(request));
  } catch {
    return jsonError(401, "Admin access required.");
  }

  try {
    const requests = await listAllPayoutRequestsForAdmin();
    return NextResponse.json({ success: true as const, requests });
  } catch {
    return jsonError(500, "Could not load payout requests.");
  }
}

export async function PATCH(request: Request) {
  try {
    assertAdminAccess(getAdminKeyFromRequest(request));
  } catch {
    return jsonError(401, "Admin access required.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const requestId = parsed.data.id;

  try {
    const updated = await updatePayoutRequestStatus({
      requestId,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    });
    return NextResponse.json({ success: true as const, request: updated });
  } catch {
    return jsonError(500, "Could not update payout request.");
  }
}
