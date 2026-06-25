import Image, { type ImageProps } from "next/image";

import { BRAND_LOGO, PRODUCT } from "@/lib/constants";

export type BrandLogoVariant =
  | "navbar"
  | "footer"
  | "welcome"
  | "auth"
  | "learnerRail"
  | "learnerMobile"
  | "compact";

const VARIANT: Record<
  BrandLogoVariant,
  { imgClass: string; sizes: string; quality: number; priority?: boolean }
> = {
  navbar: {
    imgClass:
      "h-14 w-auto max-h-16 max-w-[5.5rem] min-w-0 object-contain object-left sm:h-16 sm:max-w-[6rem] md:h-[4.75rem] md:max-w-[7rem] lg:h-[5.25rem] lg:max-w-[7.5rem]",
    sizes: "(max-width: 768px) 64px, (max-width: 1280px) 76px, 84px",
    quality: 100,
    priority: true,
  },
  compact: {
    imgClass: "h-11 w-auto max-w-full min-w-0 object-contain object-left sm:h-12",
    sizes: "48px",
    quality: 100,
  },
  footer: {
    imgClass:
      "h-32 w-auto max-w-full min-w-0 object-contain object-left sm:h-36 md:h-40",
    sizes: "(max-width: 768px) 128px, 160px",
    quality: 100,
  },
  welcome: {
    imgClass:
      "mx-auto h-36 w-auto max-w-full min-w-0 object-contain object-center sm:h-40 md:h-44 lg:h-48",
    sizes: "(max-width: 768px) 144px, (max-width: 1024px) 176px, 192px",
    quality: 100,
    priority: true,
  },
  auth: {
    imgClass: "mx-auto h-24 w-auto max-w-full min-w-0 object-contain object-center sm:h-28",
    sizes: "112px",
    quality: 100,
    priority: true,
  },
  learnerRail: {
    imgClass: "h-14 w-auto max-w-full min-w-0 object-contain object-left",
    sizes: "56px",
    quality: 100,
  },
  learnerMobile: {
    imgClass: "h-11 w-auto max-w-[3.25rem] min-w-0 object-contain object-left sm:h-12 sm:max-w-[3.5rem]",
    sizes: "48px",
    quality: 100,
  },
};

type BrandLogoProps = {
  variant: BrandLogoVariant;
  className?: string;
} & Omit<ImageProps, "src" | "width" | "height" | "alt" | "sizes" | "quality">;

export function BrandLogo({ variant, className = "", ...rest }: BrandLogoProps) {
  const v = VARIANT[variant];
  const alt = PRODUCT.name;
  return (
    <Image
      src={BRAND_LOGO.src}
      alt={alt}
      width={BRAND_LOGO.width}
      height={BRAND_LOGO.height}
      sizes={v.sizes}
      quality={v.quality}
      priority={v.priority}
      className={`${v.imgClass} ${className}`.trim()}
      {...rest}
    />
  );
}
