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
  return data as AppNotificationRow;
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
