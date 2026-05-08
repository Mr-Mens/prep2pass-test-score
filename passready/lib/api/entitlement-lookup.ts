import { ApiRequestError } from "@/lib/errors";
import {
  entitlementLookupSuccessSchema,
  type EntitlementLookupSuccess,
} from "@/lib/validation";

export async function requestEntitlementLookup(): Promise<EntitlementLookupSuccess> {
  const res = await fetch("/api/entitlements/lookup", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from entitlements service", { status: res.status });
  }

  if (!res.ok) {
    throw new ApiRequestError("Could not load account status", { status: res.status });
  }

  const ok = entitlementLookupSuccessSchema.safeParse(raw);
  if (!ok.success) {
    throw new ApiRequestError("Unexpected entitlements response shape", { status: 502 });
  }

  return ok.data;
}
