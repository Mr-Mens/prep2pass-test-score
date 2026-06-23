/** Canonical app origin for auth redirects (client + server). Prefer NEXT_PUBLIC_APP_URL in production. */
export function getPublicAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
  return "http://localhost:3000";
}
