import "server-only";

import webpush from "web-push";

import {
  countUnresolvedNotificationsForUser,
  deleteWebPushSubscriptionByEndpoint,
  listWebPushSubscriptionsForUser,
} from "@/lib/server/repositories/push-subscriptions-repository";

export type LearnerPushPayload = {
  title: string;
  body: string;
  url: string;
  badgeCount?: number;
  tag?: string;
};

function getVapidConfig(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:hello@thepasspilot.com";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function isWebPushConfigured(): boolean {
  return Boolean(getVapidConfig());
}

export function getVapidPublicKey(): string | null {
  return getVapidConfig()?.publicKey ?? null;
}

function configureWebPush(): boolean {
  const config = getVapidConfig();
  if (!config) return false;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

export async function sendLearnerWebPush(userId: string, payload: LearnerPushPayload): Promise<void> {
  if (!configureWebPush()) return;

  const subscriptions = await listWebPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) return;

  const badgeCount =
    typeof payload.badgeCount === "number"
      ? payload.badgeCount
      : await countUnresolvedNotificationsForUser(userId);

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    badgeCount,
    tag: payload.tag ?? "pass-pilot-notification",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          { TTL: 60 * 60 * 24 },
        );
      } catch (error) {
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : null;
        if (statusCode === 404 || statusCode === 410) {
          await deleteWebPushSubscriptionByEndpoint(sub.endpoint).catch(() => undefined);
          return;
        }
        console.warn("[web-push] send_failed", statusCode, error instanceof Error ? error.message : error);
      }
    }),
  );
}
