import { ApiRequestError } from "@/lib/errors";
import {
  verifyCheckoutSessionErrorSchema,
  verifyCheckoutSessionSuccessSchema,
  type VerifyCheckoutSessionSuccess,
} from "@/lib/validation";

export async function requestVerifyCheckoutSession(sessionId: string): Promise<VerifyCheckoutSessionSuccess> {
  const res = await fetch("/api/checkout/verify-session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from verification service", { status: res.status });
  }

  if (!res.ok) {
    const err = verifyCheckoutSessionErrorSchema.safeParse(raw);
    throw new ApiRequestError(
      err.success ? err.data.error.message : "Unable to verify checkout session",
      { status: res.status, code: err.success ? err.data.error.code : undefined },
    );
  }

  const ok = verifyCheckoutSessionSuccessSchema.safeParse(raw);
  if (!ok.success) {
    throw new ApiRequestError("Unexpected verification response shape", { status: 502 });
  }

  return ok.data;
}
