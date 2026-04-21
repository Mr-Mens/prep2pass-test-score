import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SITE } from "@/lib/constants";

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
    default: `TestReady Score by ${SITE.name}`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "TestReady Score by Prep2Pass: a clear UK learner assessment, practical risks, and next steps before your practical test.",
  openGraph: {
    title: `TestReady Score by ${SITE.name}`,
    description:
      "TestReady Score by Prep2Pass: a clear UK learner assessment, practical risks, and next steps before your practical test.",
    type: "website",
    locale: "en_GB",
    siteName: SITE.name,
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
        <div className="flex min-h-dvh flex-col">
          <Navbar />
          <main className="flex-1 max-md:overflow-x-hidden">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
