"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  mockTestId: string;
  alreadySent?: { sentAt: string; recipientEmail: string } | null;
};

export function SendMockTestButton({ mockTestId, alreadySent }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(alreadySent ?? null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/instructor/mock-tests/${mockTestId}/send`, {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as {
        success?: boolean;
        sentAt?: string;
        recipientEmail?: string;
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Could not send mock test report.");
        return;
      }
      setSent({
        sentAt: json.sentAt ?? new Date().toISOString(),
        recipientEmail: json.recipientEmail ?? "",
      });
      router.refresh();
    } catch {
      setError("Could not send mock test report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-900">Send to pupil</h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-700">
        Email the report and add it to the pupil&apos;s Prep2Pass app when they have a linked learner account.
      </p>
      {sent ? (
        <p className="mt-4 text-sm font-medium text-teal-900">
          Sent to {sent.recipientEmail}. The pupil can open it under Mock tests in their app.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void send()}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
      >
        {busy ? "Sending…" : sent ? "Send again" : "Send report to pupil"}
      </button>
    </section>
  );
}
