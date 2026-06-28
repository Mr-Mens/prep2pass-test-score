/** Supabase signUp response when the email is already registered (no new verification email is sent). */

export type SignupDuplicateEmail = {
  kind: "duplicate_email";
};

export type SignupResultClassification =
  | SignupDuplicateEmail
  | { kind: "ok" };

type SignUpUser = {
  identities?: { id: string }[] | null;
};

type SignUpData = {
  user?: SignUpUser | null;
  session?: unknown;
};

function isDuplicateSignupError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const o = error as { message?: unknown; code?: unknown; status?: unknown };
  const message = typeof o.message === "string" ? o.message.toLowerCase() : "";
  const code = typeof o.code === "string" ? o.code.toLowerCase() : "";
  return (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("user already registered") ||
    message.includes("email address is already") ||
    message.includes("already exists")
  );
}

/** Detect duplicate signup before treating the flow as “verification email sent”. */
export function classifySignupResult(data: SignUpData | null, error: unknown): SignupResultClassification {
  if (error) {
    if (isDuplicateSignupError(error)) return { kind: "duplicate_email" };
    return { kind: "ok" };
  }

  const identities = data?.user?.identities;
  if (identities && identities.length === 0) {
    return { kind: "duplicate_email" };
  }

  return { kind: "ok" };
}

export const SIGNUP_EMAIL_TAKEN_MESSAGE =
  "An account with this email already exists. Sign in instead, or use Forgot password if you need to reset your password.";
