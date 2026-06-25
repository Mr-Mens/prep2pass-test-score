import { normalizeUkPostcode } from "@/lib/profile/uk-postcode";

import type { UserProfileInput, UserProfileRow } from "./types";

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/** Extract profile fields stored on auth user_metadata during signup. */
export function profileInputFromSignupMetadata(metadata: Record<string, unknown> | undefined): UserProfileInput | null {
  if (!metadata) return null;

  const fullName =
    trimOrNull(metadata.full_name) ??
    trimOrNull(metadata.fullName) ??
    trimOrNull(metadata.first_name) ??
    trimOrNull(metadata.firstName);

  const postcodeRaw = trimOrNull(metadata.postcode);
  const postcode = postcodeRaw ? normalizeUkPostcode(postcodeRaw) : null;

  const teachingRaw = trimOrNull(metadata.teaching_postcode);
  const teachingPostcode = teachingRaw ? normalizeUkPostcode(teachingRaw) : null;

  if (!fullName && !postcode) return null;

  return {
    full_name: fullName,
    postcode,
    preferred_test_centre: trimOrNull(metadata.preferred_test_centre),
    adi_number: trimOrNull(metadata.adi_number),
    teaching_postcode: teachingPostcode,
    preferred_test_centre_area: trimOrNull(metadata.preferred_test_centre_area),
  };
}

export function resolveProfileDisplayName(
  profile: Pick<UserProfileRow, "full_name"> | null | undefined,
  metadata?: Record<string, unknown>,
): string {
  const fromProfile = profile?.full_name?.trim();
  if (fromProfile) return fromProfile;

  const fullMeta = trimOrNull(metadata?.full_name) ?? trimOrNull(metadata?.fullName);
  if (fullMeta) return fullMeta;

  const first = trimOrNull(metadata?.first_name) ?? trimOrNull(metadata?.firstName);
  if (first) return first;

  return "";
}

export function resolveProfileFirstName(
  profile: Pick<UserProfileRow, "full_name"> | null | undefined,
  metadata?: Record<string, unknown>,
): string {
  const display = resolveProfileDisplayName(profile, metadata);
  if (!display) return "";
  return display.split(/\s+/)[0] ?? display;
}

/** First token of full name for legacy metadata consumers. */
export function firstNameTokenFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function buildSignupMetadataProfileFields(input: {
  fullName: string;
  postcode: string;
  preferredTestCentre?: string | null;
  adiNumber?: string | null;
  teachingPostcode?: string | null;
  preferredTestCentreArea?: string | null;
}): Record<string, string> {
  const fullName = input.fullName.trim();
  const firstName = firstNameTokenFromFullName(fullName);
  const fields: Record<string, string> = {
    full_name: fullName,
    first_name: firstName,
    postcode: input.postcode,
  };

  if (input.preferredTestCentre) fields.preferred_test_centre = input.preferredTestCentre;
  if (input.adiNumber) fields.adi_number = input.adiNumber;
  if (input.teachingPostcode) fields.teaching_postcode = input.teachingPostcode;
  if (input.preferredTestCentreArea) fields.preferred_test_centre_area = input.preferredTestCentreArea;

  return fields;
}
