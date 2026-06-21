import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/instructor/",
          "/supervisor/",
          "/dashboard",
          "/account",
          "/my-reports",
          "/reports/",
          "/progress",
          "/mock-tests/",
          "/checkout/",
          "/subscribe/success",
          "/graduate",
          "/lifetime",
          "/upgrade",
          "/results",
          "/home",
          "/invite/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/report-lookup",
          "/explore",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
