import "server-only";

import { getSupabaseServerClient } from "@/lib/server/supabase";

export type WebPushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export async function upsertWebPushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}): Promise<WebPushSubscriptionRow> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("web_push_subscriptions")
    .upsert(
      {
        user_id: input.userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        user_agent: input.userAgent ?? null,
        updated_at: now,
      },
      { onConflict: "endpoint" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as WebPushSubscriptionRow;
}

export async function deleteWebPushSubscription(userId: string, endpoint: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("web_push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}

export async function deleteWebPushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("web_push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}

export async function listWebPushSubscriptionsForUser(userId: string): Promise<WebPushSubscriptionRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("web_push_subscriptions").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []) as WebPushSubscriptionRow[];
}

export async function countUnresolvedNotificationsForUser(userId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("resolved_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
