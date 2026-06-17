import type { MetadataRoute } from "next";

import { PRODUCT, SITE_DEFAULT_DESCRIPTION } from "@/lib/constants";

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
        src: "/brand/test-ready-score-logo.png",
        sizes: "1024x682",
        type: "image/png",
      },
    ],
  };
}
