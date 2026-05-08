/** Maps Supabase `signInWithPassword` failures to actionable UI buckets (British copy lives in components). */

export type ClassifiedSignInError =
  | { kind: "email_not_confirmed" }
  | { kind: "invalid_credentials" }
  | { kind: "requires_verification" }
  | { kind: "other"; detail: string };

export function classifySignInError(error: unknown): ClassifiedSignInError {
  if (!error || typeof error !== "object") {
    return { kind: "other", detail: "Something went wrong. Please try again." };
  }
  const o = error as { message?: unknown; code?: unknown };
  const code = typeof o.code === "string" ? o.code : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";
  const lower = message.toLowerCase();

  if (code === "email_not_confirmed" || lower.includes("email not confirmed")) {
    return { kind: "email_not_confirmed" };
  }
  if (
    code === "invalid_credentials" ||
    lower.includes("invalid login credentials") ||
    lower === "invalid email or password"
  ) {
    return { kind: "invalid_credentials" };
  }
  if (code === "provider_email_needs_verification" || lower.includes("email needs to be verified")) {
    return { kind: "requires_verification" };
  }

  if (message) return { kind: "other", detail: message };

  return { kind: "other", detail: "Something went wrong. Please try again." };
}
