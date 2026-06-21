/** Canonical production origin for SEO metadata, sitemap, and JSON-LD. */
export const PRODUCTION_SITE_URL = "https://thepasspilot.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return PRODUCTION_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
