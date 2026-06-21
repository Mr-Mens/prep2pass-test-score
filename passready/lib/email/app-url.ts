import "server-only";

/** Canonical app origin for links in transactional emails. */
export function getAppUrlForEmail(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (raw) return raw;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return "http://localhost:3000";
}
