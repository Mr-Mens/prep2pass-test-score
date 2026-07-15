"use client";

import { useEffect, useRef } from "react";

import { useLearnerSession } from "@/components/learner/LearnerSessionContext";
import { setHomescreenBadge } from "@/lib/pwa/badge";
import { ensureLearnerPushSubscription } from "@/lib/pwa/push-subscribe";

/**
 * Keeps the installed-app homescreen badge in sync and asks for web-push permission
 * so reflection requests can alert pupils when Pass Pilot is closed.
 */
export function LearnerPushBadgeEffects() {
  const { session, status } = useLearnerSession();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (status !== "ready" || !session) return;

    let cancelled = false;

    async function syncBadgeAndPush() {
      try {
        const res = await fetch("/api/learner/notifications", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json()) as { success?: boolean; notifications?: unknown[] };
        if (cancelled) return;
        if (json.success) {
          await setHomescreenBadge(json.notifications?.length ?? 0);
        }
      } catch {
        // Ignore offline / auth races.
      }

      if (cancelled || subscribedRef.current) return;
      subscribedRef.current = true;
      void ensureLearnerPushSubscription().catch(() => {
        subscribedRef.current = false;
      });
    }

    void syncBadgeAndPush();

    function onVisibility() {
      if (document.visibilityState === "visible") void syncBadgeAndPush();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session, status]);

  return null;
}
