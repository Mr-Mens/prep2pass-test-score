import type { Metadata } from "next";

import { PRODUCT, SITE_DEFAULT_DESCRIPTION, SITE_META_TITLE, SITE_SOCIAL_DESCRIPTION, SOCIAL_BANNER } from "@/lib/constants";

import { SEO_KEYWORDS } from "./keywords";
import { absoluteUrl, getSiteUrl } from "./site-url";

/** Target length for og:description and twitter:description in link previews. */
const SOCIAL_DESCRIPTION_MAX = 110;

function truncateForSocialPreview(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= SOCIAL_DESCRIPTION_MAX) return normalized;
  const trimmed = normalized.slice(0, SOCIAL_DESCRIPTION_MAX);
  const lastSpace = trimmed.lastIndexOf(" ");
  const cut = lastSpace > 48 ? trimmed.slice(0, lastSpace) : trimmed;
  return `${cut.trimEnd()}…`;
}

function openGraphDescription(description: string, ogDescription?: string): string {
  if (ogDescription) return ogDescription;
  if (description === SITE_DEFAULT_DESCRIPTION) return SITE_SOCIAL_DESCRIPTION;
  return truncateForSocialPreview(description);
}

/** Routes that should appear in sitemap.xml and be indexable by default. */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/about",
  "/faq",
  "/pricing",
  "/sample-report",
  "/assessment",
  "/learning-centre",
  "/welcome",
  "/terms",
  "/privacy",
] as const;

export const ROBOTS_PRIVATE: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false, noimageindex: true },
};

const openGraphImages: NonNullable<Metadata["openGraph"]>["images"] = [
  {
    url: SOCIAL_BANNER.src,
    width: SOCIAL_BANNER.width,
    height: SOCIAL_BANNER.height,
    alt: SOCIAL_BANNER.alt,
  },
];

type BuildPageMetadataInput = {
  title: string;
  description?: string;
  /** Overrides truncated description for Open Graph / Twitter only. */
  ogDescription?: string;
  path: string;
  keywords?: string[];
  index?: boolean;
  absoluteTitle?: boolean;
  ogType?: "website" | "article";
};

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const description = input.description ?? SITE_DEFAULT_DESCRIPTION;
  const socialDescription = openGraphDescription(description, input.ogDescription);
  const canonical = absoluteUrl(input.path);
  const index = input.index !== false;
  const title = input.absoluteTitle ? { absolute: input.title } : input.title;

  return {
    title,
    description,
    keywords: [...(input.keywords ?? SEO_KEYWORDS)],
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description: socialDescription,
      url: canonical,
      type: input.ogType ?? "website",
      locale: "en_GB",
      siteName: PRODUCT.name,
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: socialDescription,
      images: [SOCIAL_BANNER.src],
    },
    robots: index ? { index: true, follow: true } : ROBOTS_PRIVATE,
  };
}

/** Root layout metadata shared across the site. */
export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: SITE_META_TITLE,
      template: `%s · ${PRODUCT.name}`,
    },
    description: SITE_DEFAULT_DESCRIPTION,
    applicationName: PRODUCT.name,
    keywords: [...SEO_KEYWORDS],
    alternates: {
      canonical: absoluteUrl("/"),
    },
    openGraph: {
      title: SITE_META_TITLE,
      description: SITE_SOCIAL_DESCRIPTION,
      url: absoluteUrl("/"),
      type: "website",
      locale: "en_GB",
      siteName: PRODUCT.name,
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_META_TITLE,
      description: SITE_SOCIAL_DESCRIPTION,
      images: [SOCIAL_BANNER.src],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "education",
  };
}
