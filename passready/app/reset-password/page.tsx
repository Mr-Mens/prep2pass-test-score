"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/Button";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { Section } from "@/components/Section";
import { passwordFieldSchema } from "@/lib/auth/password";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const parsed = passwordFieldSchema.safeParse(password);
    if (!parsed.success) {
      setMsg(parsed.error.errors.map((er) => er.message).join(" "));
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMsg("This reset link expired or already used. Start again from Forgot password.");
        return;
      }
      window.location.assign("/auth/resume");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section className="bg-brand-50" contentClassName="max-w-md">
      <div className="rounded-2xl border border-brand-200/90 bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">New password</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950">Choose a new password</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Use something memorable and unique. We never mail plain passwords after you submit this form.
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <PasswordRevealField
            id="rp-pass"
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            required
            disabled={busy}
            hint={<p className="mt-2 text-xs text-brand-500">At least 8 characters, including a letter and a number.</p>}
          />

          <PasswordRevealField
            id="rp-confirm"
            label="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            required
            disabled={busy}
          />

          {msg ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {msg}
            </p>
          ) : null}

          <Button type="submit" variant="conversion" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Save new password"}
          </Button>

          <p className="text-center text-xs text-brand-500">
            <Link href="/login" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </Section>
  );
}
