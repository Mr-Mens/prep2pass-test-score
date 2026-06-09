import { NextResponse } from "next/server";

import { requireLearnerApiUser } from "@/lib/server/api-auth";
import {
  getNotificationForUser,
  resolveNotification,
} from "@/lib/server/repositories/app-notifications-repository";
import { respondToPupilInvite } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

type Props = { params: { id: string } };

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function POST(request: Request, { params }: Props) {
  const auth = await requireLearnerApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return jsonError(503, "NOT_CONFIGURED", "Database not configured.");
  }

  try {
    const body = (await request.json()) as { action?: string };
    const action = body.action === "decline" ? "decline" : body.action === "accept" ? "accept" : null;
    if (!action) return jsonError(400, "VALIDATION", "Action must be accept or decline.");

    const notification = await getNotificationForUser(params.id, auth.userId);
    if (!notification || notification.resolved_at) {
      return jsonError(404, "NOT_FOUND", "Notification not found.");
    }
    if (notification.kind !== "instructor_pupil_invite") {
      return jsonError(400, "VALIDATION", "Unsupported notification type.");
    }

    const pupilLinkId = notification.action_payload?.pupilLinkId;
    if (typeof pupilLinkId !== "string" || !pupilLinkId) {
      return jsonError(400, "VALIDATION", "Invalid invitation.");
    }

    const pupil = await respondToPupilInvite({
      pupilLinkId,
      learnerUserId: auth.userId,
      learnerEmail: auth.email,
      action,
    });

    await resolveNotification(params.id, auth.userId, {
      ...notification.action_payload,
      response: action,
    });

    return NextResponse.json({ success: true as const, pupil, action });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to respond to invitation.";
    return jsonError(500, "INVITE_RESPONSE_ERROR", msg);
  }
}
