import { ApiRequestError } from "@/lib/errors";

type ConfirmSubscriptionSuccess = {
  success: true;
  hasPremiumAccess: boolean;
  subscriptionStatus: string | null;
};

export async function requestConfirmSubscriptionCheckout(
  sessionId: string,
): Promise<ConfirmSubscriptionSuccess> {
  const res = await fetch("/api/subscription/confirm-checkout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from server", { status: res.status });
  }

  if (!res.ok) {
    const message =
      typeof raw === "object" &&
      raw !== null &&
      "error" in raw &&
      typeof (raw as { error?: { message?: string } }).error?.message === "string"
        ? (raw as { error: { message: string } }).error.message
        : "Could not confirm subscription";
    throw new ApiRequestError(message, { status: res.status });
  }

  return raw as ConfirmSubscriptionSuccess;
}
