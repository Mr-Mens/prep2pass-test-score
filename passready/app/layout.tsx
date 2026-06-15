import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";

import { AppShell } from "@/components/AppShell";
import { SITE, SITE_DEFAULT_DESCRIPTION, SOCIAL_BANNER } from "@/lib/constants";

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
    default: `Test Ready Score by ${SITE.name}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  openGraph: {
    title: `Test Ready Score by ${SITE.name}`,
    description: SITE_DEFAULT_DESCRIPTION,
    type: "website",
    locale: "en_GB",
    siteName: SITE.name,
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
    title: `Test Ready Score by ${SITE.name}`,
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
