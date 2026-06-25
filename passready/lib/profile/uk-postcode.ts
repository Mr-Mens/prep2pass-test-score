/** Normalise UK postcode: trim, remove extra spaces, uppercase, standard outward/inward spacing. */
export function normalizeUkPostcode(raw: string): string {
  const compact = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]? [0-9][A-Z]{2}$/;

export function isValidUkPostcode(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return UK_POSTCODE_RE.test(normalizeUkPostcode(trimmed));
}

export const UK_POSTCODE_INVALID_MESSAGE =
  "Enter a valid UK postcode (for example SW1A 1AA or IG11 8RN).";
