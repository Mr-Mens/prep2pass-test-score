import { DIAGRAM_CATEGORY_SLUGS, type DiagramCategorySlug } from "@/lib/instructor/diagrams/types";

export function parseDiagramCategoryFilter(value: string | null | undefined): DiagramCategorySlug | "all" {
  if (!value) return "all";
  return DIAGRAM_CATEGORY_SLUGS.includes(value as DiagramCategorySlug) ? (value as DiagramCategorySlug) : "all";
}

export function diagramLibraryHref(category: DiagramCategorySlug | "all" = "all"): string {
  if (category === "all") return "/instructor/diagrams";
  return `/instructor/diagrams?category=${category}`;
}

export function diagramDetailHref(slug: string, category: DiagramCategorySlug | "all" = "all"): string {
  const base = `/instructor/diagrams/${slug}`;
  if (category === "all") return base;
  return `${base}?category=${category}`;
}
