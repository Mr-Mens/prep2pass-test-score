"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { describeAuthEmailError } from "@/lib/auth/format-auth-email-error";
import { getPublicAppOrigin } from "@/lib/auth/public-app-origin";
import { authCallbackRedirectUrl, authResumePath } from "@/lib/auth/post-auth-destination";
import { appRoleFromDestination } from "@/lib/auth/role-from-destination";
import { passwordFieldSchema } from "@/lib/auth/password";
import {
  PROFILE_POSTCODE_HELPER,
  PROFILE_PREFERRED_TEST_CENTRE_HELPER,
  PROFILE_PREFERRED_TEST_CENTRE_PLACEHOLDER,
} from "@/lib/profile/copy";
import { buildSignupMetadataProfileFields } from "@/lib/profile/resolve-display-name";
import { normalizeUkPostcode } from "@/lib/profile/uk-postcode";
import {
  signupInstructorProfileSchema,
  signupLearnerProfileSchema,
  signupParentProfileSchema,
  type SignupInstructorProfile,
  type SignupLearnerProfile,
} from "@/lib/profile/validation";
import type { UserAppRole } from "@/lib/instructor/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ROLE_LABELS: Record<UserAppRole, string> = {
  learner: "Learner",
  instructor: "Instructor",
  parent: "Parent / supervisor",
};

const SIGNUP_INTRO: Record<UserAppRole, string> = {
  learner:
    "Create your account to track your progress, view scheduled lessons, unlock personalised Smart Reports, and continue your learning journey, all in one place.",
  instructor:
    "Create your free instructor account for mock tests, pupil tracking, and teaching tools. We email a verification link. Open it to enter Pass Pilot. Pass Pilot never asks for your password by email.",
  parent:
    "Create your parent account to link to your learner and view their progress. We email a verification link. Open it to enter Pass Pilot. Pass Pilot never asks for your password by email.",
};

const inputClassName =
  "mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm";

function safePostAuthPath(raw: string | null): string {
  if (raw?.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

function buildVerifyEmailPath(postAuthPath: string, email?: string): string {
  const q = new URLSearchParams({ continue: postAuthPath });
  if (email) q.set("email", email);
  return `/verify-email?${q.toString()}`;
}

async function syncProfileAfterSignup(): Promise<void> {
  try {
    await fetch("/api/profile", { method: "POST", credentials: "include" });
  } catch {
    /* auth/resume will retry */
  }
}

export function SignupFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postAuthPath = useMemo(() => safePostAuthPath(searchParams.get("next")), [searchParams]);
  const inviteToken = useMemo(() => searchParams.get("invite")?.trim() ?? "", [searchParams]);
  const premiumInviteToken = useMemo(() => searchParams.get("premiumInvite")?.trim() ?? "", [searchParams]);
  const prefilledEmail = useMemo(() => searchParams.get("email")?.trim().toLowerCase() ?? "", [searchParams]);
  const lockEmail = Boolean(prefilledEmail && premiumInviteToken);
  const signupFormRole = useMemo(() => appRoleFromDestination(postAuthPath) ?? "learner", [postAuthPath]);
  const loginHref = useMemo(() => {
    const q = new URLSearchParams({ next: postAuthPath });
    return `/login?${q.toString()}`;
  }, [postAuthPath]);
  const welcomeRoleHref = useMemo(() => "/welcome", []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [preferredTestCentre, setPreferredTestCentre] = useState("");
  const [adiNumber, setAdiNumber] = useState("");
  const [teachingPostcode, setTeachingPostcode] = useState("");
  const [preferredTestCentreArea, setPreferredTestCentreArea] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledEmail) setEmail(prefilledEmail);
  }, [prefilledEmail]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!terms) {
      setMsg("By creating an account, you agree to our Terms and Privacy Policy.");
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
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setMsg("Enter a valid email address.");
      return;
    }

    let profileFields: Record<string, string>;

    if (signupFormRole === "instructor") {
      const parsed = signupInstructorProfileSchema.safeParse({
        fullName,
        postcode,
        adiNumber,
        teachingPostcode,
        preferredTestCentreArea,
      });
      if (!parsed.success) {
        setMsg(parsed.error.errors.map((err) => err.message).join(" "));
        return;
      }
      const profile: SignupInstructorProfile = parsed.data;
      profileFields = buildSignupMetadataProfileFields({
        fullName: profile.fullName,
        postcode: profile.postcode,
        adiNumber: profile.adiNumber,
        teachingPostcode: profile.teachingPostcode,
        preferredTestCentreArea: profile.preferredTestCentreArea,
      });
    } else if (signupFormRole === "parent") {
      const parsed = signupParentProfileSchema.safeParse({ fullName, postcode });
      if (!parsed.success) {
        setMsg(parsed.error.errors.map((err) => err.message).join(" "));
        return;
      }
      profileFields = buildSignupMetadataProfileFields({
        fullName: parsed.data.fullName,
        postcode: parsed.data.postcode,
      });
    } else {
      const parsed = signupLearnerProfileSchema.safeParse({
        fullName,
        postcode,
        preferredTestCentre,
      });
      if (!parsed.success) {
        setMsg(parsed.error.errors.map((err) => err.message).join(" "));
        return;
      }
      const profile: SignupLearnerProfile = parsed.data;
      profileFields = buildSignupMetadataProfileFields({
        fullName: profile.fullName,
        postcode: profile.postcode,
        preferredTestCentre: profile.preferredTestCentre,
      });
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = getPublicAppOrigin();
      const { data, error } = await supabase.auth.signUp({
        email: em,
        password,
        options: {
          emailRedirectTo: authCallbackRedirectUrl(origin),
          data: {
            ...profileFields,
            app_role: signupFormRole,
            post_auth_continue: postAuthPath,
            ...(inviteToken ? { pending_invite_token: inviteToken } : {}),
            ...(premiumInviteToken ? { pending_premium_invite_token: premiumInviteToken } : {}),
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
      if (data.session) {
        await syncProfileAfterSignup();
        router.replace(authResumePath(postAuthPath));
        router.refresh();
        return;
      }
      router.replace(buildVerifyEmailPath(postAuthPath, em));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200/90 bg-white p-6 shadow-card sm:p-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">Create account</h1>
      {premiumInviteToken ? (
        <p className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
          You&apos;ve been invited to Pass Pilot Premium. Use the invited email address below, then subscribe with your
          discount applied.
        </p>
      ) : inviteToken ? (
        <p className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
          Your instructor invited you to Pass Pilot. After you verify your email, we&apos;ll link you automatically.
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-brand-600">{SIGNUP_INTRO[signupFormRole]}</p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div>
          <p className="text-sm font-medium text-brand-900">Account type</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-900">
              {ROLE_LABELS[signupFormRole]}
            </span>
            <Link href={welcomeRoleHref} className="text-xs font-semibold text-teal-800 underline-offset-4 hover:underline">
              Change role
            </Link>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-brand-900" htmlFor="su-full-name">
            Full name
          </label>
          <input
            id="su-full-name"
            className={inputClassName}
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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
            readOnly={lockEmail}
            className={`${inputClassName} read-only:bg-brand-50 read-only:text-brand-700`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-brand-900" htmlFor="su-postcode">
            Postcode
          </label>
          <input
            id="su-postcode"
            className={inputClassName}
            autoComplete="postal-code"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            onBlur={() => {
              if (postcode.trim()) setPostcode(normalizeUkPostcode(postcode));
            }}
            required
          />
          <p className="mt-2 text-xs leading-relaxed text-brand-500">{PROFILE_POSTCODE_HELPER}</p>
        </div>

        {signupFormRole === "learner" ? (
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="su-test-centre">
              Preferred test centre <span className="font-normal text-brand-500">(optional)</span>
            </label>
            <input
              id="su-test-centre"
              className={inputClassName}
              value={preferredTestCentre}
              onChange={(e) => setPreferredTestCentre(e.target.value)}
              placeholder={PROFILE_PREFERRED_TEST_CENTRE_PLACEHOLDER}
            />
            <p className="mt-2 text-xs leading-relaxed text-brand-500">{PROFILE_PREFERRED_TEST_CENTRE_HELPER}</p>
          </div>
        ) : null}

        {signupFormRole === "instructor" ? (
          <>
            <div>
              <label className="text-sm font-medium text-brand-900" htmlFor="su-adi">
                ADI/PDI number
              </label>
              <input
                id="su-adi"
                className={inputClassName}
                value={adiNumber}
                onChange={(e) => setAdiNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900" htmlFor="su-teaching-postcode">
                Teaching postcode <span className="font-normal text-brand-500">(optional)</span>
              </label>
              <input
                id="su-teaching-postcode"
                className={inputClassName}
                autoComplete="postal-code"
                value={teachingPostcode}
                onChange={(e) => setTeachingPostcode(e.target.value)}
                onBlur={() => {
                  if (teachingPostcode.trim()) setTeachingPostcode(normalizeUkPostcode(teachingPostcode));
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900" htmlFor="su-test-centre-area">
                Preferred test centre area <span className="font-normal text-brand-500">(optional)</span>
              </label>
              <input
                id="su-test-centre-area"
                className={inputClassName}
                value={preferredTestCentreArea}
                onChange={(e) => setPreferredTestCentreArea(e.target.value)}
                placeholder={PROFILE_PREFERRED_TEST_CENTRE_PLACEHOLDER}
              />
              <p className="mt-2 text-xs leading-relaxed text-brand-500">{PROFILE_PREFERRED_TEST_CENTRE_HELPER}</p>
            </div>
          </>
        ) : null}

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
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
              Terms
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
