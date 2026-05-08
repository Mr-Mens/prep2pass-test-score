import { ApiRequestError } from "@/lib/errors";
import {
  confirmUpgradeSuccessSchema,
  upgradeCheckoutSuccessSchema,
  type ConfirmUpgradeSuccess,
  type UpgradeCheckoutRequest,
  type UpgradeCheckoutSuccess,
} from "@/lib/validation";

export async function requestUpgradeCheckout(
  input: UpgradeCheckoutRequest,
): Promise<UpgradeCheckoutSuccess> {
  const res = await fetch("/api/checkout/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from upgrade service", { status: res.status });
  }
  if (!res.ok) {
    throw new ApiRequestError("Could not start upgrade", { status: res.status });
  }
  const ok = upgradeCheckoutSuccessSchema.safeParse(raw);
  if (!ok.success) {
    throw new ApiRequestError("Unexpected upgrade response shape", { status: 502 });
  }
  return ok.data;
}

export async function requestConfirmUpgrade(sessionId: string): Promise<ConfirmUpgradeSuccess> {
  const res = await fetch("/api/entitlements/confirm-upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from upgrade confirmation", { status: res.status });
  }
  if (!res.ok) {
    throw new ApiRequestError("Could not confirm upgrade", { status: res.status });
  }
  const ok = confirmUpgradeSuccessSchema.safeParse(raw);
  if (!ok.success) {
    throw new ApiRequestError("Unexpected upgrade confirmation shape", { status: 502 });
  }
  return ok.data;
}
