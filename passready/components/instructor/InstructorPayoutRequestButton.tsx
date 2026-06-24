"use client";

import { useState } from "react";

import { Button } from "@/components/Button";
import { COMMERCIAL, formatPenceGbp } from "@/lib/commercial/constants";

type Props = {
  availableForPayoutPence: number;
  minPayoutPence: number;
  hasOpenRequest: boolean;
};

export function InstructorPayoutRequestButton({
  availableForPayoutPence,
  minPayoutPence,
  hasOpenRequest,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRequest = availableForPayoutPence >= minPayoutPence && !hasOpenRequest;

  async function requestPayout() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/instructor/payout-requests", {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } | string };
      if (!json.success) {
        const msg =
          typeof json.error === "string"
            ? json.error
            : json.error?.message ?? "Could not request payout.";
        setError(msg);
        return;
      }
      setMessage("Payout request submitted. We will process it manually.");
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <Button type="button" disabled={!canRequest || busy} onClick={() => void requestPayout()}>
        {hasOpenRequest ? "Payout request pending" : "Request payout"}
      </Button>
      {!canRequest && !hasOpenRequest ? (
        <p className="text-xs text-brand-500">
          Available balance must reach {COMMERCIAL.referral.minPayoutLabel} before you can request a payout.
        </p>
      ) : null}
      {hasOpenRequest ? (
        <p className="text-xs text-brand-600">You already have an open payout request being reviewed.</p>
      ) : null}
      {message ? <p className="text-xs text-teal-800">{message}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      {canRequest ? (
        <p className="text-xs text-brand-500">
          Requesting will submit {formatPenceGbp(availableForPayoutPence)} for manual processing.
        </p>
      ) : null}
    </div>
  );
}
