"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/Button";
import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";
import { describeAuthEmailError } from "@/lib/auth/format-auth-email-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setMsg(describeAuthEmailError(error, "password_reset"));
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenChrome>
      <div className="rounded-2xl border border-brand-200/90 bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Password reset</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950">Forgotten password?</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          We&apos;ll send a signed link so you can create a fresh password. Links expire shortly for security reasons.
        </p>

        {!sent ? (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-900" htmlFor="fp-email">
                Email
              </label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {msg ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {msg}
              </p>
            ) : null}

            <Button type="submit" variant="conversion" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Email me a reset link"}
            </Button>

            <p className="text-center text-xs text-brand-500">
              <Link href="/login" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        ) : (
          <div className="mt-8 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
            <p>If that email exists on Pass Pilot, reset instructions should arrive shortly. Check inbox and spam.</p>
          </div>
        )}
      </div>
    </AuthScreenChrome>
  );
}
