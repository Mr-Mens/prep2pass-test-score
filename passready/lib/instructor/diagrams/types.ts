import type { ComponentType } from "react";

import type { DiagramImageAsset } from "@/lib/instructor/diagrams/image-asset";

export const DIAGRAM_CATEGORY_SLUGS = [
  "junctions",
  "roundabouts",
  "manoeuvres",
  "meeting-traffic",
  "dual-carriageways",
  "pedestrian-crossings",
  "independent-driving",
] as const;

export type DiagramCategorySlug = (typeof DIAGRAM_CATEGORY_SLUGS)[number];

export type DiagramDifficulty = "beginner" | "intermediate" | "advanced";

export type DiagramSvgProps = {
  className?: string;
  /** Compact thumbnail rendering in library cards */
  variant?: "full" | "thumbnail";
};

export type TeachingDiagramMeta = {
  slug: string;
  title: string;
  description: string;
  category: DiagramCategorySlug;
  teachingTimeMinutes: number;
  difficulty: DiagramDifficulty;
  teachingPoints: string[];
  commonMistakes: string[];
  relatedSlugs: string[];
  keywords: string[];
};

export type TeachingDiagram = TeachingDiagramMeta & {
  image: DiagramImageAsset;
  /** Optional programmatic SVG fallback when no image asset exists. */
  Component?: ComponentType<DiagramSvgProps>;
};

export type DiagramCategory = {
  slug: DiagramCategorySlug;
  name: string;
  description: string;
};
