"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { requestFinaliseReport } from "@/lib/api/finalise-report";
import { requestVerifyCheckoutSession } from "@/lib/api/verify-checkout-session";
import { ApiRequestError } from "@/lib/errors";
import {
  clearPendingAssessment,
  loadPendingAssessment,
  saveScoredAssessment,
} from "@/lib/storage";

type Status = "loading" | "error";

export function CheckoutSuccessFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying payment with Stripe…");

  const sessionId = useMemo(() => params.get("session_id"), [params]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!sessionId) {
        setStatus("error");
        setMessage("Missing checkout session. Return to the TestReady Score Assessment.");
        return;
      }

      const pending = loadPendingAssessment();
      if (!pending) {
        setStatus("error");
        setMessage("We could not find your saved assessment. Complete the TestReady Score Assessment again.");
        return;
      }

      try {
        const verification = await requestVerifyCheckoutSession(sessionId);
        if (!verification.paid) {
          setStatus("error");
          setMessage(
            "Your payment has not been confirmed yet. This can take a few seconds. Please try again shortly.",
          );
          return;
        }

        setMessage("Payment confirmed. Building your Premium TestReady Score Report…");
        const finalised = await requestFinaliseReport(sessionId, pending.assessment);

        if (cancelled) return;

        saveScoredAssessment({
          version: 2,
          submittedAt: new Date().toISOString(),
          assessment: finalised.assessment,
          result: finalised.result,
        });
        clearPendingAssessment();
        router.replace("/results");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          e instanceof ApiRequestError
            ? e.message
            : "We could not finalise your report. Your payment is secure — return to the TestReady Score Assessment and try again.",
        );
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-card">
        <p className="text-sm font-medium text-brand-600">Processing securely</p>
        <p className="mt-2 text-base text-brand-900">{message}</p>
        <p className="mt-2 text-xs text-brand-500">
          Your Premium TestReady Score Report unlocks only after server-side payment verification.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-card">
      <p className="text-sm font-semibold text-red-700">Checkout could not be completed</p>
      <p className="mt-2 text-sm text-brand-800">{message}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button href="/assessment" className="w-full sm:w-auto">
          Back to assessment
        </Button>
        <Button href="/" variant="secondary" className="w-full sm:w-auto">
          Home
        </Button>
      </div>
    </div>
  );
}
