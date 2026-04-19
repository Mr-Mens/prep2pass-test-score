import { NextResponse } from "next/server";

import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

function startOfDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonError(401, "UNAUTHORIZED", gate.message);

  try {
    const supabase = getSupabaseServerClient();

    const [reportsCountRes, paidSessionsCountRes, reportsAgg, recentReports, allPayments] = await Promise.all([
      supabase.from("reports").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("payment_status", "paid"),
      supabase.from("reports").select("readiness_score,report_source"),
      supabase.from("reports").select("id").gte("created_at", startOfDaysAgo(7)),
      supabase.from("payments").select("amount_total,payment_status,created_at"),
    ]);

    const paymentRows = allPayments.data ?? [];
    const totalRevenue = paymentRows
      .filter((p) => p.payment_status === "paid")
      .reduce((sum, p) => sum + (p.amount_total ?? 0), 0);

    const revenueLast30Days = paymentRows
      .filter((p) => p.payment_status === "paid" && new Date(p.created_at) >= new Date(startOfDaysAgo(30)))
      .reduce((sum, p) => sum + (p.amount_total ?? 0), 0);

    const aiReportCount = (reportsAgg.data ?? []).filter((r) => r.report_source === "ai").length;
    const fallbackReportCount = (reportsAgg.data ?? []).filter((r) => r.report_source !== "ai").length;
    const averageReadinessScore =
      reportsAgg.data && reportsAgg.data.length > 0
        ? Number(
            (
              reportsAgg.data.reduce((sum, r) => sum + (r.readiness_score ?? 0), 0) / reportsAgg.data.length
            ).toFixed(1),
          )
        : null;
    const totalReportsCount = reportsCountRes.count ?? 0;
    const totalPaidSessionsCount = paidSessionsCountRes.count ?? 0;
    const conversionProxyRate =
      totalReportsCount > 0 && totalPaidSessionsCount > 0
        ? Number((totalReportsCount / totalPaidSessionsCount).toFixed(2))
        : null;

    return NextResponse.json({
      success: true as const,
      totalReports: totalReportsCount,
      totalPaidSessions: totalPaidSessionsCount,
      totalRevenue,
      aiReportCount,
      fallbackReportCount,
      conversionProxyRate,
      averageReadinessScore,
      reportsLast7Days: recentReports.data?.length ?? 0,
      revenueLast30Days,
    });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to load analytics overview");
  }
}
