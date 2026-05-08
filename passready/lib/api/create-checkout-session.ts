import { ApiRequestError } from "@/lib/errors";
import {
  createCheckoutSessionErrorSchema,
  createCheckoutSessionSuccessSchema,
  type AssessmentPayload,
  type CheckoutPriceTier,
  type CreateCheckoutSessionSuccess,
} from "@/lib/validation";

export async function requestCheckoutSession(
  assessment: AssessmentPayload,
  tier: CheckoutPriceTier,
): Promise<CreateCheckoutSessionSuccess> {
  const res = await fetch("/api/checkout/create-session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assessment, tier }),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from checkout service", { status: res.status });
  }

  if (!res.ok) {
    const err = createCheckoutSessionErrorSchema.safeParse(raw);
    throw new ApiRequestError(
      err.success ? err.data.error.message : "Unable to start checkout right now",
      { status: res.status, code: err.success ? err.data.error.code : undefined },
    );
  }

  const ok = createCheckoutSessionSuccessSchema.safeParse(raw);
  if (!ok.success) {
    throw new ApiRequestError("Unexpected checkout response shape", { status: 502 });
  }

  return ok.data;
}
