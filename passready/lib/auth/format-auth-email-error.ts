/** Calm British-English messaging when Supabase Auth rate-limits transactional emails (signup verify, reset, resend). */

export type AuthEmailAction = "signup_verify" | "resend_verify" | "password_reset";

function isLikelyEmailRateLimited(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const o = error as { message?: unknown; status?: unknown; code?: unknown };
  const raw = typeof o.message === "string" ? o.message.trim() : "";
  const lower = raw.toLowerCase();
  const codeRaw = typeof o.code === "string" ? o.code.toLowerCase() : "";

  const status = typeof o.status === "number" ? o.status : NaN;

  return (
    status === 429 ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("email rate") ||
    codeRaw.includes("rate") ||
    codeRaw.includes("over_email") ||
    codeRaw === "too_many_requests"
  );
}

export function describeAuthEmailError(error: unknown, action: AuthEmailAction): string {
  if (isLikelyEmailRateLimited(error)) {
    if (action === "password_reset") {
      return "Several reset emails were requested in a short time, so sending has paused briefly. Wait a little, then request again, or use a link that may already be in your inbox or junk folder.";
    }
    if (action === "resend_verify") {
      return "Several verification emails were requested in a short time, so sending has paused briefly. Wait a little, then tap resend again, or find the confirmation we may already have sent (check junk as well as inbox).";
    }
    return "Several confirmation emails were requested in a short time, so sending has paused briefly. Wait a little before trying again. Check inbox and junk first in case a link is already waiting.";
  }

  if (!error || typeof error !== "object") {
    return "Something went wrong sending email. Please try again in a few minutes.";
  }
  const message = typeof (error as { message?: unknown }).message === "string" ? (error as { message: string }).message.trim() : "";
  return message.length > 0 ? message : "Something went wrong. Please try again shortly.";
}
