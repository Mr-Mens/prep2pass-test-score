import { NextResponse } from "next/server";
import { z } from "zod";

import { getReportById } from "@/lib/server/repositories/reports-repository";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().uuid() });

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const parsed = paramsSchema.safeParse(ctx.params);
  if (!parsed.success) return jsonError(400, "INVALID_ID", "Report id is invalid");

  try {
    const report = await getReportById(parsed.data.id);
    if (!report) return jsonError(404, "NOT_FOUND", "Report not found");
    return NextResponse.json({ success: true as const, report });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unable to load report");
  }
}
