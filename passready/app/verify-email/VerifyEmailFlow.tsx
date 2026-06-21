"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { describeAuthEmailError } from "@/lib/auth/format-auth-email-error";
import { appRoleFromDestination } from "@/lib/auth/role-from-destination";
import type { UserAppRole } from "@/lib/instructor/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const VERIFY_INTRO: Record<UserAppRole, string> = {
  learner:
    "Pass Pilot needs a verified inbox before Premium reports appear. That binds retrieval tightly to your account and keeps away from accidental sharing.",
  instructor:
    "Pass Pilot needs a verified inbox before you can open your instructor workspace. That keeps pupil data tied to the right account.",
  parent:
    "Pass Pilot needs a verified inbox before you can link to your learner and view their progress.",
};

export function VerifyEmailFlow() {
  const params = useSearchParams();

  const continueSafe = useMemo(() => {
    const raw = params.get("continue");
    return raw?.startsWith("/") && !raw.startsWith("//") ? raw : null;
  }, [params]);

  const verifyRole = useMemo(
    () => appRoleFromDestination(continueSafe) ?? "learner",
    [continueSafe],
  );

  const resumeHref = useMemo(
    () =>
      continueSafe ? `/auth/resume?continue=${encodeURIComponent(continueSafe)}` : "/auth/resume",
    [continueSafe],
  );

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
      else setMsg("Fresh verification instructions are heading to your inbox.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal-200/70 bg-white p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Email verification</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-brand-950">
          Verify your email to continue
        </h1>
        <p className="mt-3 text-base leading-relaxed text-brand-700">{VERIFY_INTRO[verifyRole]}</p>
        <p className="mt-6 text-sm text-brand-600">
          Already verified? Reload this tab or jump back to{" "}
          <Link href={resumeHref} className="font-semibold text-teal-900 underline underline-offset-4">
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
  );
}
