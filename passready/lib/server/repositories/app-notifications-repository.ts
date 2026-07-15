import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";

import type { AppNotificationRow } from "@/lib/instructor/pupil-link-types";

export async function listUnresolvedNotificationsForUser(userId: string): Promise<AppNotificationRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_notifications")
    .select("*")
    .eq("user_id", userId)
    .is("resolved_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as AppNotificationRow[];
}

export async function createInstructorPupilInviteNotification(input: {
  learnerUserId: string;
  pupilLinkId: string;
  instructorName: string;
  pupilName: string;
}): Promise<AppNotificationRow | null> {
  const supabase = getSupabaseServerClient();
  const title = "Instructor link request";
  const body = `${input.instructorName.trim() || "Your driving instructor"} would like to link your Pass Pilot account as their pupil (${input.pupilName.trim() || "learner"}). Accept to share progress with them.`;

  const { data, error } = await supabase
    .from("app_notifications")
    .insert({
      user_id: input.learnerUserId,
      kind: "instructor_pupil_invite",
      title,
      body,
      action_type: "instructor_pupil_invite",
      action_payload: { pupilLinkId: input.pupilLinkId },
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }

  const row = data as AppNotificationRow;
  try {
    const { sendLearnerWebPush } = await import("@/lib/server/web-push");
    await sendLearnerWebPush(input.learnerUserId, {
      title,
      body,
      url: "/dashboard",
      tag: `instructor-invite-${input.pupilLinkId}`,
    });
  } catch (e) {
    console.warn("[notifications] invite_push_failed", e instanceof Error ? e.message : e);
  }

  return row;
}

export async function createLessonReflectionRequestNotification(input: {
  learnerUserId: string;
  lessonId: string;
  lessonDate: string;
  instructorName: string;
  durationMinutes: number;
  lessonFocus: string[];
}): Promise<AppNotificationRow | null> {
  const supabase = getSupabaseServerClient();
  const instructorLabel = input.instructorName.trim() || "Your instructor";
  const title = "Log your lesson reflection";
  const body = `${instructorLabel} marked your lesson on ${input.lessonDate} as complete. Take two minutes to log how it went. This helps your Pass Pilot progress.`;

  const { data, error } = await supabase
    .from("app_notifications")
    .insert({
      user_id: input.learnerUserId,
      kind: "lesson_reflection_request",
      title,
      body,
      action_type: "lesson_reflection_request",
      action_payload: {
        lessonId: input.lessonId,
        lessonDate: input.lessonDate,
        durationMinutes: input.durationMinutes,
        lessonFocus: input.lessonFocus,
        instructorName: instructorLabel,
      },
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }

  const row = data as AppNotificationRow;
  const params = new URLSearchParams({
    lessonId: input.lessonId,
    lessonDate: input.lessonDate,
  });
  if (input.durationMinutes > 0) {
    params.set("hours", String(Math.max(0.5, Math.round((input.durationMinutes / 60) * 2) / 2)));
  }
  if (input.lessonFocus.length > 0) {
    params.set("topics", input.lessonFocus.join(","));
  }

  try {
    const { sendLearnerWebPush } = await import("@/lib/server/web-push");
    await sendLearnerWebPush(input.learnerUserId, {
      title,
      body,
      url: `/dashboard/reflections/new?${params.toString()}`,
      tag: `lesson-reflection-${input.lessonId}`,
    });
  } catch (e) {
    console.warn("[notifications] reflection_push_failed", e instanceof Error ? e.message : e);
  }

  return row;
}

export async function resolveLessonReflectionRequestNotifications(
  lessonId: string,
  learnerUserId: string,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("app_notifications")
    .select("id, action_payload")
    .eq("user_id", learnerUserId)
    .eq("kind", "lesson_reflection_request")
    .is("resolved_at", null);

  if (error) throw new Error(error.message);

  const matches = (data ?? []).filter(
    (row) => (row.action_payload as Record<string, unknown> | null)?.lessonId === lessonId,
  );

  for (const row of matches) {
    await supabase
      .from("app_notifications")
      .update({
        resolved_at: now,
        read_at: now,
      })
      .eq("id", row.id as string)
      .eq("user_id", learnerUserId);
  }
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase
    .from("app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function resolveNotification(
  notificationId: string,
  userId: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  await supabase
    .from("app_notifications")
    .update({
      resolved_at: now,
      read_at: now,
      action_payload: payload ?? {},
    })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function getNotificationForUser(
  notificationId: string,
  userId: string,
): Promise<AppNotificationRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_notifications")
    .select("*")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AppNotificationRow | null;
}
