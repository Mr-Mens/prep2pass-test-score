"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { classifySignInError } from "@/lib/auth/classify-sign-in-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const nextRaw = params.get("next");
  const nextResolved = useMemo(
    () => (nextRaw?.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/auth/resume"),
    [nextRaw],
  );

  const postLoginHref = useMemo(() => {
    if (nextResolved === "/auth/resume") return "/auth/resume";
    return `/auth/resume?continue=${encodeURIComponent(nextResolved)}`;
  }, [nextResolved]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  /** Sign-in failures: clarify unverified-email vs typos without fragile string checks. */
  const [issue, setIssue] = useState<{ kind: "verify" | "credentials" | "other"; detail?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIssue(null);
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

  return (
    <div className="rounded-2xl border border-brand-200/90 bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Sign in</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950">Welcome back</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Use your Prep2Pass credentials. New accounts cannot sign in until the verification email has been confirmed.
        </p>
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

          <Button type="submit" variant="conversion" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
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
