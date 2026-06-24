import { NextResponse } from "next/server";

import { requireInstructorApiUser } from "@/lib/server/api-auth";
import { createInstructorPayoutRequest } from "@/lib/server/repositories/instructor-commissions-repository";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return NextResponse.json({ success: false as const, error: { message } }, { status });
}

export async function POST() {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, auth.message);

  try {
    const request = await createInstructorPayoutRequest(auth.userId);
    return NextResponse.json({ success: true as const, request });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not request payout.";
    if (message === "PAYOUT_BELOW_MINIMUM") {
      return jsonError(400, "Your available balance must reach £20 before requesting a payout.");
    }
    if (message === "PAYOUT_REQUEST_ALREADY_OPEN") {
      return jsonError(409, "You already have an open payout request.");
    }
    return jsonError(500, "Could not request payout. Try again shortly.");
  }
}
