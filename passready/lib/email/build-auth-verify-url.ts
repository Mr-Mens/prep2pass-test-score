import "server-only";

import { getAppUrlForEmail } from "@/lib/email/app-url";

/**
 * Direct app callback link for auth emails (signup confirm, password reset, etc.).
 * Avoids Supabase /auth/v1/verify → redirect_to, which falls back to Site URL when redirect_to fails allow-list checks.
 */
export function buildAuthConfirmCallbackUrl(input: {
  token_hash: string;
  email_action_type: string;
}): string {
  const params = new URLSearchParams({
    token_hash: input.token_hash,
    type: input.email_action_type,
  });
  return `${getAppUrlForEmail()}/auth/callback?${params.toString()}`;
}

/** @deprecated Use buildAuthConfirmCallbackUrl — kept for imports during transition. */
export function buildSupabaseAuthVerifyUrl(input: {
  token_hash: string;
  email_action_type: string;
  redirect_to: string;
}): string {
  void input.redirect_to;
  return buildAuthConfirmCallbackUrl(input);
}
