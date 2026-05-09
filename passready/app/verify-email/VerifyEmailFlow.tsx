"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { describeAuthEmailError } from "@/lib/auth/format-auth-email-error";

export function VerifyEmailFlow() {
  const params = useSearchParams();
  const nextSafe = useMemo(() => {
    const raw = params.get("next");
    return raw?.startsWith("/") && !raw.startsWith("//") ? raw : "/assessment";
  }, [params]);

  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function resend() {
    setMsg(null);
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const email = session?.user.email;
      if (!email) {
        setMsg("We could not detect your signup email yet. Refresh or sign up again.");
        return;
      }
      const origin = window.location.origin;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${origin}/auth/callback?next=/verify-email` },
      });
      if (error) setMsg(describeAuthEmailError(error, "resend_verify"));
      else setMsg("Fresh verification instructions are heading to your inbox.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section className="bg-brand-50" contentClassName="max-w-lg">
      <div className="rounded-2xl border border-teal-200/70 bg-white p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Email verification</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-brand-950">
          Verify your email to continue
        </h1>
        <p className="mt-3 text-base leading-relaxed text-brand-700">
          Prep2Pass needs a verified inbox before Premium reports appear. That binds retrieval tightly to your account and keeps
          away from accidental sharing.
        </p>
        <p className="mt-6 text-sm text-brand-600">
          Already verified? Reload this tab or jump back to{" "}
          <Link href={nextSafe} className="font-semibold text-teal-900 underline underline-offset-4">
            continue
          </Link>
          .
        </p>

        {msg ? <p className="mt-5 text-sm leading-relaxed text-brand-900">{msg}</p> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void resend()}>
            {busy ? "Sending…" : "Resend verification email"}
          </Button>
          <Button href="/login" variant="ghost">
            Use a different inbox
          </Button>
        </div>
      </div>
    </Section>
  );
}
