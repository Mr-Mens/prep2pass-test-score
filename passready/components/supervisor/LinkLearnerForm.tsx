"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";

export function LinkLearnerForm() {
  const router = useRouter();
  const [learnerName, setLearnerName] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch("/api/supervisor/link-learner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerName, learnerEmail }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        link?: { status?: string };
        error?: { message?: string };
      };
      if (!res.ok || !data.success) {
        setError(data.error?.message ?? "Could not link learner.");
        return;
      }
      setSuccess(
        data.link?.status === "linked"
          ? "Learner linked. Their progress will appear on your dashboard."
          : "Link saved. We will connect automatically when your learner has a Pass Pilot account with this email.",
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50 sm:p-8"
    >
      <h2 className="font-heading text-lg font-semibold text-brand-950">Link your learner</h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-600">
        Enter the email your learner uses for Pass Pilot. If they already have reports on that account, linking is
        instant. Otherwise we will connect when their account is ready.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-brand-900" htmlFor="ll-name">
            Learner name
          </label>
          <input
            id="ll-name"
            type="text"
            autoComplete="name"
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            value={learnerName}
            onChange={(e) => setLearnerName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900" htmlFor="ll-email">
            Learner email
          </label>
          <input
            id="ll-email"
            type="email"
            autoComplete="email"
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            value={learnerEmail}
            onChange={(e) => setLearnerEmail(e.target.value)}
            required
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          {success}
        </p>
      ) : null}

      <Button type="submit" variant="conversion" className="mt-6 min-h-[50px] w-full sm:w-auto" disabled={busy}>
        {busy ? "Linking…" : "Link learner"}
      </Button>

      <div className="mt-8 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Learner invitation</p>
        <p className="mt-2 text-sm text-brand-700">
          Ask your learner to sign up at Pass Pilot with the same email, or share their report reference from their
          account. Full invitation flows are coming soon.
        </p>
      </div>
    </form>
  );
}
