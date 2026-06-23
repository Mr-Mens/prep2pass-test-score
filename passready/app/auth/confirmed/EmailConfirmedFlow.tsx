"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/Button";

type Props = {
  signedIn: boolean;
  email: string | null;
  firstName: string | null;
};

function safeContinuePath(raw: string | null): string | null {
  if (!raw?.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function EmailConfirmedFlow({ signedIn, email, firstName }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const continuePath = useMemo(() => safeContinuePath(params.get("continue")), [params]);

  const continueHref = useMemo(
    () => (continuePath ? `/auth/resume?continue=${encodeURIComponent(continuePath)}` : "/auth/resume"),
    [continuePath],
  );

  const loginHref = useMemo(() => {
    if (!continuePath) return "/login";
    return `/login?next=${encodeURIComponent(continuePath)}`;
  }, [continuePath]);

  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!signedIn) return;

    const tick = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    const redirect = window.setTimeout(() => {
      router.replace(continueHref);
    }, 5000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [signedIn, continueHref, router]);

  const greeting = firstName?.trim() ? firstName.trim() : null;

  return (
    <div className="rounded-2xl border border-teal-200/80 bg-white p-8 shadow-card">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-2xl text-teal-800"
        aria-hidden
      >
        ✓
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-teal-700">Email verified</p>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950">
        {signedIn ? "You're all set" : "Your email is confirmed"}
      </h1>

      {signedIn ? (
        <>
          <p className="mt-4 text-base leading-relaxed text-brand-700">
            {greeting ? `${greeting}, your` : "Your"} Pass Pilot account is verified
            {email ? (
              <>
                {" "}
                for <span className="font-semibold text-brand-900">{email}</span>
              </>
            ) : null}
            . You can continue into the app now.
          </p>
          <p className="mt-3 text-sm text-brand-600">
            Continuing automatically in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}…
          </p>
          <Button href={continueHref} variant="conversion" className="mt-8 w-full min-h-[52px]">
            Continue to Pass Pilot
          </Button>
        </>
      ) : (
        <>
          <p className="mt-4 text-base leading-relaxed text-brand-700">
            {params.get("error") === "session"
              ? "Your email is verified, but this browser session did not stay signed in. Sign in below to continue."
              : "Your email address is confirmed. Sign in with the password you chose at signup to open your workspace."}
          </p>
          {email ? (
            <p className="mt-3 text-sm text-brand-600">
              Account: <span className="font-semibold text-brand-900">{email}</span>
            </p>
          ) : null}
          <Button href={loginHref} variant="conversion" className="mt-8 w-full min-h-[52px]">
            Sign in
          </Button>
          <p className="mt-4 text-center text-xs text-brand-500">
            Link expired?{" "}
            <Link href="/verify-email" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
              Resend verification email
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
