import type { MetadataRoute } from "next";

import { BRAND_ICONS, PRODUCT, SITE_DEFAULT_DESCRIPTION } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT.name,
    short_name: PRODUCT.name,
    description: SITE_DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1c2230",
    lang: "en-GB",
    icons: [
      {
        src: BRAND_ICONS.icon192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: BRAND_ICONS.icon512,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
