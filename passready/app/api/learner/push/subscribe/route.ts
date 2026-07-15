import { NextResponse } from "next/server";
import { z } from "zod";

import { requireLearnerApiUser } from "@/lib/server/api-auth";
import {
  deleteWebPushSubscription,
  upsertWebPushSubscription,
} from "@/lib/server/repositories/push-subscriptions-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { isWebPushConfigured } from "@/lib/server/web-push";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
});

export async function POST(request: Request) {
  const auth = await requireLearnerApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "SUPABASE", "Database is not configured.");
  if (!isWebPushConfigured()) return jsonError(503, "PUSH_NOT_CONFIGURED", "Web push is not configured.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION", parsed.error.errors[0]?.message ?? "Invalid subscription.");
  }

  try {
    await upsertWebPushSubscription({
      userId: auth.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({ success: true as const });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save push subscription.";
    if (message.toLowerCase().includes("web_push_subscriptions") || message.toLowerCase().includes("does not exist")) {
      return jsonError(
        503,
        "MIGRATION_REQUIRED",
        "Run supabase/migrations/025_web_push_subscriptions.sql in the Supabase SQL Editor.",
      );
    }
    return jsonError(500, "SUBSCRIBE_ERROR", message);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireLearnerApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "SUPABASE", "Database is not configured.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION", "Invalid endpoint.");
  }

  try {
    await deleteWebPushSubscription(auth.userId, parsed.data.endpoint);
    return NextResponse.json({ success: true as const });
  } catch (e) {
    return jsonError(500, "UNSUBSCRIBE_ERROR", e instanceof Error ? e.message : "Could not remove subscription.");
  }
}
