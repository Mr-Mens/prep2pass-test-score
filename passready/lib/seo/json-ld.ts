import { BRAND_LOGO, PRICING, PRODUCT, SITE_DEFAULT_DESCRIPTION } from "@/lib/constants";
import type { PublicFaqItem } from "@/lib/content/public-faq";

import { absoluteUrl } from "./site-url";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PRODUCT.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(BRAND_LOGO.src),
    description: SITE_DEFAULT_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "United Kingdom",
    },
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: PRODUCT.name,
    url: absoluteUrl("/"),
    description: SITE_DEFAULT_DESCRIPTION,
    inLanguage: "en-GB",
    publisher: {
      "@type": "Organization",
      name: PRODUCT.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(BRAND_LOGO.src),
      },
    },
  };
}

export function faqPageJsonLd(items: PublicFaqItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function productOfferJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${PRODUCT.name} Premium`,
    description:
      "Monthly subscription for learners: unlimited Test Ready Score assessments, Premium AI reports, and progress tracking until you pass or cancel.",
    brand: {
      "@type": "Brand",
      name: PRODUCT.name,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/pricing"),
      priceCurrency: "GBP",
      price: "6.99",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "6.99",
        priceCurrency: "GBP",
        unitText: "MONTH",
        billingDuration: 1,
        billingIncrement: 1,
      },
      description: `${PRICING.subscription.display}/month until you pass or cancel. Instructors and parents use Pass Pilot free.`,
    },
  };
}

export function webPageJsonLd(input: { path: string; title: string; description: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: PRODUCT.name,
      url: absoluteUrl("/"),
    },
    inLanguage: "en-GB",
  };
}
