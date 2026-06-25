"use client";

import { useState } from "react";

import { Button } from "@/components/Button";
import {
  PROFILE_POSTCODE_HELPER,
  PROFILE_PREFERRED_TEST_CENTRE_HELPER,
  PROFILE_PREFERRED_TEST_CENTRE_PLACEHOLDER,
} from "@/lib/profile/copy";
import { normalizeUkPostcode } from "@/lib/profile/uk-postcode";
import type { UserProfileRow } from "@/lib/profile/types";
import type { UserAppRole } from "@/lib/instructor/types";

type Props = {
  role: UserAppRole;
  initialProfile: UserProfileRow | null;
  email: string;
};

type FormState = {
  fullName: string;
  postcode: string;
  preferredTestCentre: string;
  adiNumber: string;
  teachingPostcode: string;
  preferredTestCentreArea: string;
};

function initialForm(profile: UserProfileRow | null): FormState {
  return {
    fullName: profile?.full_name ?? "",
    postcode: profile?.postcode ?? "",
    preferredTestCentre: profile?.preferred_test_centre ?? "",
    adiNumber: profile?.adi_number ?? "",
    teachingPostcode: profile?.teaching_postcode ?? "",
    preferredTestCentreArea: profile?.preferred_test_centre_area ?? "",
  };
}

const inputClassName =
  "mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm";

export function ProfileEditForm({ role, initialProfile, email }: Props) {
  const [form, setForm] = useState<FormState>(() => initialForm(initialProfile));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    setSaved(false);

    const body =
      role === "instructor"
        ? {
            fullName: form.fullName,
            postcode: form.postcode,
            adiNumber: form.adiNumber,
            teachingPostcode: form.teachingPostcode,
            preferredTestCentreArea: form.preferredTestCentreArea,
          }
        : role === "parent"
          ? {
              fullName: form.fullName,
              postcode: form.postcode,
            }
          : {
              fullName: form.fullName,
              postcode: form.postcode,
              preferredTestCentre: form.preferredTestCentre,
            };

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        setMsg(json.error?.message ?? "Could not save profile.");
        return;
      }
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4 border-t border-brand-100 pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Profile details</h2>
      <p className="text-xs text-brand-500">Signed in as {email}</p>

      <div>
        <label className="text-sm font-medium text-brand-900" htmlFor="profile-full-name">
          Full name
        </label>
        <input
          id="profile-full-name"
          className={inputClassName}
          autoComplete="name"
          value={form.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-brand-900" htmlFor="profile-postcode">
          Postcode
        </label>
        <input
          id="profile-postcode"
          className={inputClassName}
          autoComplete="postal-code"
          value={form.postcode}
          onChange={(e) => setField("postcode", e.target.value)}
          onBlur={() => {
            if (form.postcode.trim()) setField("postcode", normalizeUkPostcode(form.postcode));
          }}
          required
        />
        <p className="mt-2 text-xs leading-relaxed text-brand-500">{PROFILE_POSTCODE_HELPER}</p>
      </div>

      {role === "learner" ? (
        <div>
          <label className="text-sm font-medium text-brand-900" htmlFor="profile-test-centre">
            Preferred test centre
          </label>
          <input
            id="profile-test-centre"
            className={inputClassName}
            value={form.preferredTestCentre}
            onChange={(e) => setField("preferredTestCentre", e.target.value)}
            placeholder={PROFILE_PREFERRED_TEST_CENTRE_PLACEHOLDER}
          />
          <p className="mt-2 text-xs leading-relaxed text-brand-500">{PROFILE_PREFERRED_TEST_CENTRE_HELPER}</p>
        </div>
      ) : null}

      {role === "instructor" ? (
        <>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="profile-adi">
              ADI/PDI number
            </label>
            <input
              id="profile-adi"
              className={inputClassName}
              value={form.adiNumber}
              onChange={(e) => setField("adiNumber", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="profile-teaching-postcode">
              Teaching postcode <span className="font-normal text-brand-500">(optional)</span>
            </label>
            <input
              id="profile-teaching-postcode"
              className={inputClassName}
              autoComplete="postal-code"
              value={form.teachingPostcode}
              onChange={(e) => setField("teachingPostcode", e.target.value)}
              onBlur={() => {
                if (form.teachingPostcode.trim()) {
                  setField("teachingPostcode", normalizeUkPostcode(form.teachingPostcode));
                }
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="profile-test-centre-area">
              Preferred test centre area <span className="font-normal text-brand-500">(optional)</span>
            </label>
            <input
              id="profile-test-centre-area"
              className={inputClassName}
              value={form.preferredTestCentreArea}
              onChange={(e) => setField("preferredTestCentreArea", e.target.value)}
              placeholder={PROFILE_PREFERRED_TEST_CENTRE_PLACEHOLDER}
            />
            <p className="mt-2 text-xs leading-relaxed text-brand-500">{PROFILE_PREFERRED_TEST_CENTRE_HELPER}</p>
          </div>
        </>
      ) : null}

      {msg ? (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {msg}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Profile saved.
        </p>
      ) : null}

      <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
