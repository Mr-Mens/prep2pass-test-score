import { NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  return jsonError(410, "DEPRECATED", "Use magic link access flow");
}

export async function POST() {
  return jsonError(410, "DEPRECATED", "Use magic link access flow");
}
