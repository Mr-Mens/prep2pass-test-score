"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { describeAuthEmailError } from "@/lib/auth/format-auth-email-error";
import { appRoleFromDestination } from "@/lib/auth/role-from-destination";
import { isSelfServiceAppRole } from "@/lib/auth/self-service-roles";
import { passwordFieldSchema } from "@/lib/auth/password";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safePostAuthPath(raw: string | null): string {
  if (raw?.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export function SignupFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postAuthPath = useMemo(() => safePostAuthPath(searchParams.get("next")), [searchParams]);
  const inviteToken = useMemo(() => searchParams.get("invite")?.trim() ?? "", [searchParams]);
  const signupAppRole = useMemo(() => {
    const fromPath = appRoleFromDestination(postAuthPath) ?? "learner";
    return isSelfServiceAppRole(fromPath) ? fromPath : "learner";
  }, [postAuthPath]);
  /** After email confirmation lands on verify-email with the same destination intent */
  const verifyEmailHref = useMemo(() => {
    const q = new URLSearchParams({ continue: postAuthPath });
    return `/verify-email?${q.toString()}`;
  }, [postAuthPath]);
  const loginHref = useMemo(() => {
    const q = new URLSearchParams({ next: postAuthPath });
    return `/login?${q.toString()}`;
  }, [postAuthPath]);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!terms) {
      setMsg("Please confirm you agree to our Terms of Use and Privacy Policy.");
      return;
    }
    const pw = passwordFieldSchema.safeParse(password);
    if (!pw.success) {
      setMsg(pw.error.errors.map((err) => err.message).join(" "));
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }
    const fn = firstName.trim();
    if (!fn || fn.length < 2) {
      setMsg("Enter your first name.");
      return;
    }
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setMsg("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const nextAfterCallback = `/verify-email?continue=${encodeURIComponent(postAuthPath)}`;
      const { error } = await supabase.auth.signUp({
        email: em,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextAfterCallback)}`,
          data: {
            first_name: fn,
            app_role: signupAppRole,
            ...(inviteToken ? { pending_invite_token: inviteToken } : {}),
            ...(appRoleFromDestination(postAuthPath) === "instructor"
              ? { signup_intent: "instructor" as const }
              : {}),
          },
        },
      });
      if (error) {
        setMsg(describeAuthEmailError(error, "signup_verify"));
        return;
      }
      router.replace(verifyEmailHref);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200/90 bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Create account</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950">Join Prep2Pass</h1>
        {inviteToken ? (
          <p className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
            Your instructor invited you to Prep2Pass. After you verify your email, we&apos;ll link you automatically.
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Your Premium reports stay linked to your account so only you can open them. We email a verification link so we know the inbox belongs to you; please confirm before signing in. Payments stay inside Stripe and Prep2Pass never asks you to repeat your password via email.
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="su-first">
              First name
            </label>
            <input
              id="su-first"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="su-email">
              Email
            </label>
            <input
              id="su-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <PasswordRevealField
            id="su-pass"
            label="Password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            required
            hint={<p className="mt-2 text-xs text-brand-500">At least 8 characters, including a letter and a number.</p>}
            disabled={busy}
          />

          <PasswordRevealField
            id="su-confirm"
            label="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            required
            disabled={busy}
          />

          <label className="flex gap-3 text-sm leading-snug text-brand-800">
            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-brand-300" checked={terms} onChange={() => setTerms((v) => !v)} />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {msg ? (
            <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {msg}
            </p>
          ) : null}

          <Button type="submit" variant="conversion" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create secure account"}
          </Button>

          <p className="text-center text-xs text-brand-500">
            Already joined?{" "}
            <Link href={loginHref} className="font-semibold text-teal-800 underline-offset-4 hover:underline">
              Sign in
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
