"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BRAND_CTA } from "@/lib/constants";

export function AddPupilForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/instructor/pupils", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pupilName: name.trim(), pupilEmail: email.trim() }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Could not save pupil.");
        return;
      }
      setName("");
      setEmail("");
      router.refresh();
    } catch {
      setError("Could not save pupil.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">{BRAND_CTA.invitePupil}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-brand-800">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm text-brand-950 shadow-sm"
          />
        </label>
        <label className="block text-sm font-medium text-brand-800">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm text-brand-950 shadow-sm"
          />
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 min-h-[44px] rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
      >
        {busy ? "Sending…" : BRAND_CTA.sendScoreInvite}
      </button>
    </form>
  );
}
