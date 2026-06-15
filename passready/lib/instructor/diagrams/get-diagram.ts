import { TEACHING_DIAGRAMS, TEACHING_DIAGRAMS_BY_SLUG } from "@/lib/instructor/diagrams/catalog";
import type { TeachingDiagram } from "@/lib/instructor/diagrams/types";

export function getAllTeachingDiagrams(): TeachingDiagram[] {
  return TEACHING_DIAGRAMS;
}

export function getTeachingDiagramBySlug(slug: string): TeachingDiagram | null {
  return TEACHING_DIAGRAMS_BY_SLUG[slug] ?? null;
}

export function getRelatedTeachingDiagrams(diagram: TeachingDiagram): TeachingDiagram[] {
  return diagram.relatedSlugs
    .map((relatedSlug) => TEACHING_DIAGRAMS_BY_SLUG[relatedSlug])
    .filter((item): item is TeachingDiagram => Boolean(item));
}
