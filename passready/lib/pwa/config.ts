import { BRAND_ICONS, PRODUCT, SITE_DEFAULT_DESCRIPTION } from "@/lib/constants";

/** Shared PWA configuration for manifest, service worker, and install UI. */
export const PWA = {
  name: PRODUCT.name,
  shortName: PRODUCT.name,
  description: SITE_DEFAULT_DESCRIPTION,
  themeColor: "#1c2230",
  backgroundColor: "#ffffff",
  display: "standalone" as const,
  orientation: "portrait" as const,
  startUrl: "/?source=pwa",
  scope: "/",
  id: "/?source=pwa",
  lang: "en-GB",
  categories: ["education", "productivity"] as const,
  swPath: "/sw.js",
  swScope: "/",
  offlinePath: "/offline.html",
  cacheVersion: "pass-pilot-pwa-v5",
  installDismissKey: "passready_pwa_install_dismissed",
} as const;

export const PWA_PRECACHE_PATHS = [
  PWA.startUrl,
  "/",
  PWA.offlinePath,
  "/manifest.webmanifest",
  BRAND_ICONS.favicon32,
  BRAND_ICONS.icon192,
  BRAND_ICONS.icon192Maskable,
  BRAND_ICONS.icon512,
  BRAND_ICONS.icon512Maskable,
  BRAND_ICONS.apple180,
] as const;

export const PWA_MANIFEST_ICONS = [
  {
    src: BRAND_ICONS.icon192,
    sizes: "192x192",
    type: "image/png" as const,
    purpose: "any" as const,
  },
  {
    src: BRAND_ICONS.icon512,
    sizes: "512x512",
    type: "image/png" as const,
    purpose: "any" as const,
  },
  {
    src: BRAND_ICONS.icon192Maskable,
    sizes: "192x192",
    type: "image/png" as const,
    purpose: "maskable" as const,
  },
  {
    src: BRAND_ICONS.icon512Maskable,
    sizes: "512x512",
    type: "image/png" as const,
    purpose: "maskable" as const,
  },
] as const;
