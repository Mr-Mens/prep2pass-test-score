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
      "h-14 w-auto max-h-16 min-w-[3.25rem] object-contain object-left sm:h-16 sm:min-w-[3.75rem] md:h-[4.75rem] md:min-w-[4.25rem] lg:h-[5.25rem] lg:min-w-[4.75rem]",
    sizes: "(max-width: 768px) 64px, (max-width: 1280px) 76px, 84px",
    quality: 100,
    priority: true,
  },
  compact: {
    imgClass: "h-11 w-auto min-w-[2.75rem] object-contain object-left sm:h-12 sm:min-w-[3rem]",
    sizes: "48px",
    quality: 100,
  },
  footer: {
    imgClass:
      "h-32 w-auto min-w-[7rem] object-contain object-left sm:h-36 sm:min-w-[8rem] md:h-40 md:min-w-[9rem]",
    sizes: "(max-width: 768px) 128px, 160px",
    quality: 100,
  },
  welcome: {
    imgClass:
      "mx-auto h-36 w-auto min-w-[9rem] object-contain object-center sm:h-40 sm:min-w-[10rem] md:h-44 md:min-w-[11rem] lg:h-48 lg:min-w-[12rem]",
    sizes: "(max-width: 768px) 144px, (max-width: 1024px) 176px, 192px",
    quality: 100,
    priority: true,
  },
  auth: {
    imgClass: "mx-auto h-24 w-auto min-w-[6rem] object-contain object-center sm:h-28 sm:min-w-[7rem]",
    sizes: "112px",
    quality: 100,
    priority: true,
  },
  learnerRail: {
    imgClass: "h-14 w-auto min-w-[3.25rem] object-contain object-left",
    sizes: "56px",
    quality: 100,
  },
  learnerMobile: {
    imgClass: "h-11 w-auto min-w-[2.75rem] object-contain object-left sm:h-12 sm:min-w-[3rem]",
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
