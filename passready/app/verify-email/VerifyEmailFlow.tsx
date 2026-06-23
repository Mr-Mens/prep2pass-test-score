"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { describeAuthEmailError } from "@/lib/auth/format-auth-email-error";
import { authCallbackRedirectUrl } from "@/lib/auth/post-auth-destination";
import { getPublicAppOrigin } from "@/lib/auth/public-app-origin";
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

function parseEmailParam(raw: string | null): string | null {
  const value = raw?.trim().toLowerCase();
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

export function VerifyEmailFlow() {
  const params = useSearchParams();

  const continueSafe = useMemo(() => {
    const raw = params.get("continue") ?? params.get("next");
    return raw?.startsWith("/") && !raw.startsWith("//") ? raw : null;
  }, [params]);

  const emailFromUrl = useMemo(() => parseEmailParam(params.get("email")), [params]);

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

  const [manualEmail, setManualEmail] = useState("");
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(emailFromUrl);
  const [msg, setMsg] = useState<string | null>(() => {
    if (params.get("error") === "callback") {
      return "That confirmation link could not finish signing you in. Resend a fresh link below, or sign in if you already confirmed.";
    }
    return null;
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (emailFromUrl) {
      setResolvedEmail(emailFromUrl);
      setManualEmail(emailFromUrl);
      return;
    }

    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      const detected = user?.email?.trim().toLowerCase() ?? null;
      if (detected) {
        setResolvedEmail(detected);
        setManualEmail(detected);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [emailFromUrl]);

  const displayEmail = resolvedEmail ?? parseEmailParam(manualEmail);

  async function resend() {
    setMsg(null);
    const email = displayEmail ?? parseEmailParam(manualEmail);
    if (!email) {
      setMsg("Enter the email address you used to sign up, then try again.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = getPublicAppOrigin();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: authCallbackRedirectUrl(origin) },
      });
      if (error) setMsg(describeAuthEmailError(error, "resend_verify"));
      else {
        setResolvedEmail(email);
        setMsg("We've sent another confirmation email. Check your inbox and spam folder.");
      }
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
      {displayEmail ? (
        <p className="mt-4 text-sm text-brand-600">
          Sent to <span className="font-semibold text-brand-900">{displayEmail}</span>
        </p>
      ) : null}
      <p className="mt-4 text-sm text-brand-600">Can&apos;t see it? Check your spam folder, or resend below.</p>
      <p className="mt-4 text-sm text-brand-600">
        Already confirmed?{" "}
        <Link href={resumeHref} className="font-semibold text-teal-900 underline underline-offset-4">
          Continue to Pass Pilot
        </Link>
        .
      </p>

      {!displayEmail ? (
        <div className="mt-6">
          <label className="text-sm font-medium text-brand-900" htmlFor="verify-email">
            Email address
          </label>
          <input
            id="verify-email"
            type="email"
            autoComplete="email"
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      ) : null}

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
