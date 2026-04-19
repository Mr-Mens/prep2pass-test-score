import { NextResponse } from "next/server";

import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import { getRecentSales } from "@/lib/server/repositories/payments-repository";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonError(401, "UNAUTHORIZED", gate.message);

  try {
    const sales = await getRecentSales(20);
    return NextResponse.json({
      success: true as const,
      sales: sales.map((p) => ({
        created_at: p.created_at,
        amount_total: p.amount_total,
        currency: p.currency,
        payment_status: p.payment_status,
        customer_email: p.customer_email,
        stripe_session_id: p.stripe_session_id,
      })),
    });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to load recent sales");
  }
}
