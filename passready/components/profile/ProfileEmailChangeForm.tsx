"use client";

import { useState } from "react";

import { Button } from "@/components/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  currentEmail: string;
};

const inputClassName =
  "mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm";

export function ProfileEmailChangeForm({ currentEmail }: Props) {
  const [email, setEmail] = useState(currentEmail);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSuccess(null);

    const next = email.trim().toLowerCase();
    if (!next || next === currentEmail.trim().toLowerCase()) {
      setMsg("Enter a new email address that is different from your current one.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ email: next });
      if (error) {
        setMsg(error.message);
        return;
      }
      setSuccess(
        "We sent a confirmation link to your new email address. Your sign-in email will update once you confirm it.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 border-t border-brand-100 pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Email address</h2>
      <p className="text-xs leading-relaxed text-brand-500">
        Changing your email sends a confirmation link to the new address. Billing and instructor links stay tied to your
        account once confirmed.
      </p>

      <div>
        <label className="text-sm font-medium text-brand-900" htmlFor="profile-email">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          autoComplete="email"
          className={inputClassName}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSuccess(null);
          }}
          required
        />
      </div>

      {msg ? (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {msg}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{success}</p>
      ) : null}

      <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
        {busy ? "Sending…" : "Update email"}
      </Button>
    </form>
  );
}
