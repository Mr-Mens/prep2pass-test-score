import Image, { type ImageProps } from "next/image";

import { BRAND_LOGO, PRODUCT } from "@/lib/constants";

export type BrandLogoVariant = "navbar" | "footer" | "welcome" | "auth" | "learnerRail" | "learnerMobile";

const VARIANT: Record<
  BrandLogoVariant,
  { imgClass: string; sizes: string; quality: number; priority?: boolean }
> = {
  navbar: {
    imgClass:
      "h-16 w-auto max-w-[min(600px,calc(100vw-5.5rem))] object-contain object-left sm:h-[4.75rem] md:h-[5.75rem] lg:h-[6.5rem]",
    sizes: "(max-width: 768px) 94vw, (max-width: 1280px) 520px, 640px",
    quality: 95,
    priority: true,
  },
  footer: {
    imgClass:
      "h-32 w-auto max-w-[min(600px,100%)] object-contain object-left sm:h-36 md:h-[10.5rem]",
    sizes: "(max-width: 768px) min(94vw,560px), 640px",
    quality: 95,
  },
  welcome: {
    imgClass:
      "mx-auto h-32 w-auto max-w-[min(92vw,34rem)] object-contain object-center sm:h-[8.5rem] md:h-40",
    sizes: "(max-width: 768px) 94vw, (max-width: 1024px) 520px, 640px",
    quality: 96,
    priority: true,
  },
  auth: {
    imgClass:
      "mx-auto h-[5.25rem] w-auto max-w-[min(92vw,18rem)] object-contain object-center sm:h-[6rem]",
    sizes: "(max-width: 640px) 92vw, 320px",
    quality: 95,
    priority: true,
  },
  learnerRail: {
    imgClass:
      "h-14 w-auto max-w-[min(100%,16.25rem)] object-contain object-left brightness-0 invert opacity-[0.97]",
    sizes: "288px",
    quality: 94,
  },
  learnerMobile: {
    imgClass: "h-[3.125rem] w-auto max-w-[min(240px,58vw)] object-contain object-left sm:h-[3.5rem]",
    sizes: "(max-width: 640px) 240px, 280px",
    quality: 94,
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
