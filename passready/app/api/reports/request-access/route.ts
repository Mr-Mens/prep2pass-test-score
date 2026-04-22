import { NextResponse } from "next/server";
import { z } from "zod";

import { createReportAccessToken } from "@/lib/server/report-access-token";
import { getClientIp, checkRateLimit } from "@/lib/server/rate-limit";
import { sendReportAccessEmail } from "@/lib/server/send-report-access-email";

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().trim().email(),
});

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError(400, "INVALID_JSON", "Request body must be valid JSON");

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Email is required");
    }

    const ip = getClientIp(request);
    const email = parsed.data.email.toLowerCase();
    const ipKey = `reports_request_access:ip:${ip}`;
    const emailKey = `reports_request_access:email:${email}`;

    if (!checkRateLimit(ipKey, 8, 10 * 60 * 1000) || !checkRateLimit(emailKey, 5, 10 * 60 * 1000)) {
      return jsonError(429, "RATE_LIMITED", "Too many requests, try again in a few minutes");
    }

    const token = createReportAccessToken(email);
    const link = `${appUrl()}/reports/access?token=${encodeURIComponent(token)}`;

    await sendReportAccessEmail({ toEmail: email, accessUrl: link });
    return NextResponse.json({ success: true as const });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to process request right now");
  }
}

export async function GET() {
  return jsonError(405, "METHOD_NOT_ALLOWED", "Only POST is supported");
}

