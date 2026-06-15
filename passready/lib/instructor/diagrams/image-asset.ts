import manifest from "@/lib/instructor/diagrams/image-manifest.json";
import type { DiagramImageSlug } from "@/lib/instructor/diagrams/assets";

export type DiagramImageAsset = {
  src: string;
  width: number;
  height: number;
};

export function getDiagramImageAsset(slug: DiagramImageSlug): DiagramImageAsset {
  const entry = manifest[slug as keyof typeof manifest];
  if (!entry) {
    throw new Error(`Missing diagram image manifest entry for: ${slug}`);
  }
  return {
    src: `/diagrams/${slug}.webp`,
    width: entry.width,
    height: entry.height,
  };
}
