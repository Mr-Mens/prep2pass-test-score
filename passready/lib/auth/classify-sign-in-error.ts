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

  if (
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("networkerror") ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND"
  ) {
    return {
      kind: "other",
      detail:
        "We could not reach the sign-in service. Check your internet connection, confirm your Supabase project is active (not paused), and verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local — then restart the dev server.",
    };
  }

  if (message) return { kind: "other", detail: message };

  return { kind: "other", detail: "Something went wrong. Please try again." };
}
