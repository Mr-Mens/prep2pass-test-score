import { ApiRequestError } from "@/lib/errors";
import { progressSuccessSchema, type ProgressSuccess } from "@/lib/validation";

export async function requestProgress(): Promise<ProgressSuccess> {
  const res = await fetch("/api/progress", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiRequestError("Invalid response from progress service", { status: res.status });
  }

  if (!res.ok) {
    throw new ApiRequestError("Could not load progress", { status: res.status });
  }

  const ok = progressSuccessSchema.safeParse(raw);
  if (!ok.success) {
    throw new ApiRequestError("Unexpected progress response shape", { status: 502 });
  }

  return ok.data;
}
