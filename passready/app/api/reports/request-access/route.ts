import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: "ACCOUNT_REQUIRED",
        message: "Report access now lives inside your Pass Pilot account. Sign in and open the Dashboard instead.",
      },
    },
    { status: 403 },
  );
}

export async function GET() {
  return NextResponse.json({ success: false as const, error: { code: "GONE", message: "Deprecated" } }, { status: 410 });
}
