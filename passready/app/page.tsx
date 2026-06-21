import type { Metadata } from "next";

import { MarketingHomePage } from "@/components/marketing/MarketingHomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { PUBLIC_FAQ } from "@/lib/content/public-faq";
import { SITE_DEFAULT_DESCRIPTION, SITE_META_TITLE } from "@/lib/constants";
import { faqPageJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = buildPageMetadata({
  title: SITE_META_TITLE,
  description: SITE_DEFAULT_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  await redirectIfAuthenticated();

  return (
    <>
      <JsonLd data={faqPageJsonLd(PUBLIC_FAQ.slice(0, 6))} />
      <MarketingHomePage />
    </>
  );
}
