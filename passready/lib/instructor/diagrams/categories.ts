import type { DiagramCategory, DiagramCategorySlug } from "@/lib/instructor/diagrams/types";

export const DIAGRAM_CATEGORIES: DiagramCategory[] = [
  {
    slug: "junctions",
    name: "Junctions",
    description: "Emerging, priority, and observation at UK junctions.",
  },
  {
    slug: "roundabouts",
    name: "Roundabouts",
    description: "Lane discipline, signalling, and exit planning on UK roundabouts.",
  },
  {
    slug: "manoeuvres",
    name: "Manoeuvres",
    description: "Parallel park, bay park, and pull up on the right.",
  },
  {
    slug: "meeting-traffic",
    name: "Meeting Traffic",
    description: "Passing places and priority on narrow UK roads.",
  },
  {
    slug: "dual-carriageways",
    name: "Dual Carriageways",
    description: "Slip roads, acceleration lanes, and safe overtaking.",
  },
  {
    slug: "pedestrian-crossings",
    name: "Pedestrian Crossings",
    description: "Zebra, pelican, and toucan crossings with UK markings.",
  },
  {
    slug: "independent-driving",
    name: "Independent Driving",
    description: "Following sat nav directions and road sign sequences.",
  },
];

export function getDiagramCategory(slug: DiagramCategorySlug): DiagramCategory {
  const match = DIAGRAM_CATEGORIES.find((c) => c.slug === slug);
  if (!match) throw new Error(`Unknown diagram category: ${slug}`);
  return match;
}

export function getDiagramCategoryName(slug: DiagramCategorySlug): string {
  return getDiagramCategory(slug).name;
}
