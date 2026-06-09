"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { classifySignInError } from "@/lib/auth/classify-sign-in-error";
import {
  loginIntentRoleFromContinue,
  loginPathForRole,
  otherSignInRoles,
  ROLE_SIGN_IN_LABEL,
  roleMismatchMessage,
} from "@/lib/auth/login-intent";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const nextRaw = params.get("next");
  const roleMismatch = params.get("error") === "role_mismatch";

  const nextResolved = useMemo(() => {
    if (!nextRaw?.startsWith("/") || nextRaw.startsWith("//")) return null;
    return loginIntentRoleFromContinue(nextRaw) ? nextRaw : null;
  }, [nextRaw]);

  const signingInAs = useMemo(
    () => (nextResolved ? loginIntentRoleFromContinue(nextResolved) : null),
    [nextResolved],
  );

  const postLoginHref = useMemo(() => {
    if (!nextResolved) return null;
    return `/auth/resume?continue=${encodeURIComponent(nextResolved)}`;
  }, [nextResolved]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<{ kind: "verify" | "credentials" | "other"; detail?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIssue(null);
    if (!postLoginHref) return;

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        const c = classifySignInError(error);
        if (c.kind === "email_not_confirmed" || c.kind === "requires_verification") {
          setIssue({ kind: "verify" });
        } else if (c.kind === "invalid_credentials") {
          setIssue({ kind: "credentials" });
        } else {
          setIssue({ kind: "other", detail: c.detail });
        }
        return;
      }
      router.replace(postLoginHref);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!nextResolved || !signingInAs) {
    return (
      <div className="rounded-2xl border border-brand-200/90 bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Sign in</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950">Choose your role first</h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-600">
          Sign in must start from the welcome page (Learner, Instructor, or Parent) so we open the correct workspace for
          your account.
        </p>
        <Button href="/welcome" variant="conversion" className="mt-8 w-full">
          Back to welcome
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-200/90 bg-white p-6 shadow-card sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Sign in</p>
      <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950">Welcome back</h1>
      <p className="mt-2 text-sm leading-relaxed text-brand-600">
        Signing in as <span className="font-semibold text-brand-900">{ROLE_SIGN_IN_LABEL[signingInAs]}</span>. Use your
        Prep2Pass credentials for this role.
      </p>

      {roleMismatch && signingInAs ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
        >
          <p>{roleMismatchMessage(signingInAs)}</p>
          <p className="mt-2 text-brand-800">Try another sign-in option or choose a different role.</p>
          <div className="mt-4 flex flex-col gap-2">
            {otherSignInRoles(signingInAs).map((role) => (
              <Link
                key={role}
                href={loginPathForRole(role)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-amber-300/80 bg-white px-4 text-sm font-semibold text-brand-900 transition hover:border-teal-300 hover:bg-teal-50/50"
              >
                Sign in as {ROLE_SIGN_IN_LABEL[role]}
              </Link>
            ))}
            <Link
              href="/welcome"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-teal-900 underline-offset-4 hover:underline"
            >
              Choose a different role
            </Link>
          </div>
        </div>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-brand-900" htmlFor="li-email">
            Email
          </label>
          <input
            id="li-email"
            type="email"
            autoComplete="email"
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <PasswordRevealField
          id="li-pass"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />

        <div className="flex justify-end text-xs">
          <Link href="/forgot-password" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>

        {issue?.kind === "verify" ? (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
          >
            <p>Please verify your email to continue. Check your inbox and spam folder for our message.</p>
            <p className="mt-3">
              <Link href="/verify-email" className="font-semibold text-teal-900 underline-offset-4 hover:underline">
                Resend verification email
              </Link>
            </p>
          </div>
        ) : null}

        {issue?.kind === "credentials" ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            We could not match that email and password. Use the eye icon beside the password field to review what you
            typed, or use Forgot password above.
          </p>
        ) : null}

        {issue?.kind === "other" && issue.detail ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {issue.detail}
          </p>
        ) : null}

        <Button type="submit" variant="conversion" className="w-full" disabled={busy || !postLoginHref}>
          {busy ? "Signing in…" : `Sign in as ${ROLE_SIGN_IN_LABEL[signingInAs]}`}
        </Button>

        <p className="text-center text-xs text-brand-500">
          New here?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(nextResolved)}`}
            className="font-semibold text-teal-800 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>

        <p className="text-center text-[11px] text-brand-500">
          <Link href="/welcome" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
            ← Back to welcome
          </Link>
        </p>
      </form>
    </div>
  );
}
