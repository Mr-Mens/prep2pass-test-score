"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { requestConfirmSubscriptionCheckout } from "@/lib/api/confirm-subscription-checkout";

type Status = "loading" | "ready" | "error";

const confirmPromises = new Map<string, Promise<void>>();

export function SubscribeSuccessFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = useMemo(() => params.get("session_id")?.trim() ?? "", [params]);

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Confirming your Premium trial with Stripe…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!sessionId) {
        setStatus("error");
        setMessage("Missing checkout session. Return to subscribe and try again.");
        return;
      }

      try {
        if (!confirmPromises.has(sessionId)) {
          confirmPromises.set(
            sessionId,
            requestConfirmSubscriptionCheckout(sessionId).then(() => undefined),
          );
        }
        await confirmPromises.get(sessionId);
        if (cancelled) return;
        setStatus("ready");
        router.refresh();
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "We could not confirm your subscription yet. Try again in a moment.",
        );
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  if (status === "loading") {
    return (
      <section className="mx-auto max-w-lg rounded-3xl border border-teal-200 bg-teal-50/60 p-8 text-center shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">Subscription active</p>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-950">Activating Premium</h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-700">{message}</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-amber-50/80 p-8 text-center shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-900">Almost there</p>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-950">Confirming subscription</h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-800">{message}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Button href="/subscribe" variant="conversion" className="min-h-[48px]">
            Back to subscribe
          </Button>
          <Button href="/dashboard" variant="secondary" className="min-h-[48px]">
            Go to dashboard
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-teal-200 bg-teal-50/60 p-8 text-center shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">Subscription active</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-950">You&apos;re all set</h1>
      <p className="mt-3 text-sm leading-relaxed text-brand-700">
        Unlimited assessments, progress tracking, and Personalised Smart Reports are now unlocked on your account.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white"
      >
        Go to dashboard
      </Link>
    </section>
  );
}
