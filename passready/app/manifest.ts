import type { MetadataRoute } from "next";

import { PWA, PWA_MANIFEST_ICONS } from "@/lib/pwa/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: PWA.id,
    name: PWA.name,
    short_name: PWA.shortName,
    description: PWA.description,
    start_url: PWA.startUrl,
    scope: PWA.scope,
    display: PWA.display,
    orientation: PWA.orientation,
    background_color: PWA.backgroundColor,
    theme_color: PWA.themeColor,
    lang: PWA.lang,
    categories: [...PWA.categories],
    icons: PWA_MANIFEST_ICONS.map((icon) => ({
      src: icon.src,
      sizes: icon.sizes,
      type: icon.type,
      purpose: icon.purpose,
    })),
  };
}
