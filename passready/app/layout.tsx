import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";

import { AppShell } from "@/components/AppShell";
import { PRODUCT, SITE_DEFAULT_DESCRIPTION, SITE_META_TITLE, SOCIAL_BANNER, BRAND_ICONS } from "@/lib/constants";

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
  metadataBase: new URL("https://passready.app"),
  title: {
    default: SITE_META_TITLE,
    template: `%s · ${PRODUCT.name}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  applicationName: PRODUCT.name,
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
    title: PRODUCT.name,
    statusBarStyle: "default",
  },
  openGraph: {
    title: SITE_META_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    type: "website",
    locale: "en_GB",
    siteName: PRODUCT.name,
    images: [
      {
        url: SOCIAL_BANNER.src,
        width: SOCIAL_BANNER.width,
        height: SOCIAL_BANNER.height,
        alt: SOCIAL_BANNER.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_META_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [SOCIAL_BANNER.src],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1c2230",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${interTight.variable}`}>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
