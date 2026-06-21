import type { MetadataRoute } from "next";

import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/assessment" || path === "/pricing" ? 0.9 : 0.7,
  }));
}
