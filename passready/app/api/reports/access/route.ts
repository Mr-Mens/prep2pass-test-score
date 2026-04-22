import { NextResponse } from "next/server";
import { z } from "zod";

import { getReportSummaryByEmail } from "@/lib/server/repositories/reports-repository";
import { getClientIp, checkRateLimit } from "@/lib/server/rate-limit";
import { verifyReportAccessToken } from "@/lib/server/report-access-token";

export const runtime = "nodejs";

const querySchema = z.object({
  token: z.string().min(1),
});

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({ token: url.searchParams.get("token") ?? "" });
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Token is required");
    }

    const ip = getClientIp(request);
    if (!checkRateLimit(`reports_access:ip:${ip}`, 20, 10 * 60 * 1000)) {
      return jsonError(429, "RATE_LIMITED", "Too many requests, try again in a few minutes");
    }

    const tokenState = verifyReportAccessToken(parsed.data.token);
    if (!tokenState.valid) {
      return jsonError(401, "INVALID_TOKEN", "Link is invalid or expired");
    }

    const reports = await getReportSummaryByEmail(tokenState.email);
    return NextResponse.json({ success: true as const, reports });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to load reports right now");
  }
}

