import "server-only";

/** Supabase Auth verification link (used in custom send-email hook emails). */
export function buildSupabaseAuthVerifyUrl(input: {
  token_hash: string;
  email_action_type: string;
  redirect_to: string;
}): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  const params = new URLSearchParams({
    token: input.token_hash,
    type: input.email_action_type,
    redirect_to: input.redirect_to,
  });

  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
}
