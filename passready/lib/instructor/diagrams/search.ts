import { getDiagramCategoryName } from "@/lib/instructor/diagrams/categories";
import type { DiagramCategorySlug, TeachingDiagramMeta } from "@/lib/instructor/diagrams/types";

export function normaliseDiagramQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function filterDiagramsByCategory<T extends { category: DiagramCategorySlug }>(
  items: T[],
  category: DiagramCategorySlug | "all",
): T[] {
  if (category === "all") return items;
  return items.filter((item) => item.category === category);
}

export function filterDiagramsByQuery<T extends TeachingDiagramMeta>(
  items: T[],
  query: string,
): T[] {
  const q = normaliseDiagramQuery(query);
  if (!q) return items;

  return items.filter((item) => {
    const haystack = [
      item.title,
      item.description,
      getDiagramCategoryName(item.category),
      item.difficulty,
      ...item.keywords,
      ...item.teachingPoints,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
