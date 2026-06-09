import { NextResponse } from "next/server";

import { requireLearnerApiUser } from "@/lib/server/api-auth";
import { listLearnerNotifications } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  const auth = await requireLearnerApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true as const, notifications: [] as const });
  }
  try {
    const notifications = await listLearnerNotifications(auth.userId, auth.email);
    return NextResponse.json({ success: true as const, notifications });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to load notifications.";
    return jsonError(500, "NOTIFICATIONS_ERROR", msg);
  }
}
