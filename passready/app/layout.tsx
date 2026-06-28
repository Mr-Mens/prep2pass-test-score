import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";

import { AppShell } from "@/components/AppShell";
import { PwaRootEffects } from "@/components/pwa/PwaProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { BRAND_ICONS } from "@/lib/constants";
import { PWA } from "@/lib/pwa/config";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildRootMetadata } from "@/lib/seo/metadata";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  ...buildRootMetadata(),
  icons: {
    icon: [
      { url: BRAND_ICONS.favicon32, sizes: "32x32", type: "image/png" },
      { url: BRAND_ICONS.icon192, sizes: "192x192", type: "image/png" },
      { url: BRAND_ICONS.icon512, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: BRAND_ICONS.apple180, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: PWA.shortName,
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": PWA.shortName,
  },
};

export const viewport: Viewport = {
  themeColor: PWA.themeColor,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${interTight.variable}`}>
      <body className="font-sans">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <PwaRootEffects />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
