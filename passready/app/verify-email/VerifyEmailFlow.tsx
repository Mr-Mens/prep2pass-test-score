"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { describeAuthEmailError } from "@/lib/auth/format-auth-email-error";
import { appRoleFromDestination } from "@/lib/auth/role-from-destination";
import type { UserAppRole } from "@/lib/instructor/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const VERIFY_HEADING = "Check your inbox";

const VERIFY_INTRO: Record<UserAppRole, string> = {
  learner:
    "We sent a confirmation link to your email. Open it to finish setting up your account. Your reports stay saved and only you can open them.",
  instructor:
    "We sent a confirmation link to your email. Open it to finish setting up your instructor account.",
  parent:
    "We sent a confirmation link to your email. Open it to finish setting up your parent account.",
};

export function VerifyEmailFlow() {
  const params = useSearchParams();

  const continueSafe = useMemo(() => {
    const raw = params.get("continue");
    return raw?.startsWith("/") && !raw.startsWith("//") ? raw : null;
  }, [params]);

  const verifyRole = useMemo(
    () => (continueSafe ? appRoleFromDestination(continueSafe) : null) ?? "learner",
    [continueSafe],
  );

  const resumeHref = useMemo(
    () =>
      continueSafe ? `/auth/resume?continue=${encodeURIComponent(continueSafe)}` : "/auth/resume",
    [continueSafe],
  );

  const signupAgainHref = useMemo(() => {
    const q = new URLSearchParams();
    if (continueSafe) q.set("next", continueSafe);
    const query = q.toString();
    return query ? `/signup?${query}` : "/signup";
  }, [continueSafe]);

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
      const verifyPath = `/verify-email${continueSafe ? `?continue=${encodeURIComponent(continueSafe)}` : ""}`;
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(verifyPath)}`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo },
      });
      if (error) setMsg(describeAuthEmailError(error, "resend_verify"));
      else setMsg("We've sent another confirmation email. Check your inbox and spam folder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal-200/70 bg-white p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Email verification</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-brand-950">
          {VERIFY_HEADING}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-brand-700">{VERIFY_INTRO[verifyRole]}</p>
        <p className="mt-4 text-sm text-brand-600">Can&apos;t see it? Check your spam folder, or resend below.</p>
        <p className="mt-4 text-sm text-brand-600">
          Already confirmed?{" "}
          <Link href={resumeHref} className="font-semibold text-teal-900 underline underline-offset-4">
            Continue to Pass Pilot
          </Link>
          .
        </p>

        {msg ? <p className="mt-5 text-sm leading-relaxed text-brand-900">{msg}</p> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void resend()}>
            {busy ? "Sending…" : "Resend verification email"}
          </Button>
          <Button href={signupAgainHref} variant="ghost">
            Wrong email? Sign up again
          </Button>
        </div>
      </div>
  );
}
