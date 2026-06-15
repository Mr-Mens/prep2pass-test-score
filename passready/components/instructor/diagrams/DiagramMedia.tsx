"use client";

import Image from "next/image";

import { getDiagramImageAsset } from "@/lib/instructor/diagrams/image-asset";
import type { DiagramImageAsset } from "@/lib/instructor/diagrams/image-asset";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

type Props = DiagramSvgProps & {
  image: DiagramImageAsset;
  alt: string;
  Component?: React.ComponentType<DiagramSvgProps>;
};

export function DiagramMedia({ image, alt, Component, className, variant = "full" }: Props) {
  if (image?.src) {
    const isThumbnail = variant === "thumbnail";

    return (
      <div
        className={
          className ??
          `flex w-full items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-brand-100/80 ${
            isThumbnail ? "h-44 sm:h-48" : "min-h-[280px] sm:min-h-[360px]"
          }`
        }
      >
        <Image
          src={image.src}
          alt={alt}
          width={image.width}
          height={image.height}
          sizes={isThumbnail ? "(max-width: 640px) 45vw, 280px" : "(max-width: 1024px) 100vw, 960px"}
          className="max-h-full max-w-full object-contain"
          loading={isThumbnail ? "lazy" : "eager"}
          decoding="async"
          draggable={false}
        />
      </div>
    );
  }

  if (Component) {
    return <Component variant={variant} className={className} />;
  }

  return null;
}
