import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DiagramDetailPanels } from "@/components/instructor/diagrams/DiagramDetailPanels";
import { DiagramViewer } from "@/components/instructor/diagrams/DiagramViewer";
import { TEACHING_DIAGRAMS } from "@/lib/instructor/diagrams/catalog";
import { getDiagramCategoryName } from "@/lib/instructor/diagrams/categories";
import { getRelatedTeachingDiagrams, getTeachingDiagramBySlug } from "@/lib/instructor/diagrams/get-diagram";
import { diagramLibraryHref, parseDiagramCategoryFilter } from "@/lib/instructor/diagrams/navigation";
import { SITE } from "@/lib/constants";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
};

export async function generateStaticParams() {
  return TEACHING_DIAGRAMS.map((diagram) => ({ slug: diagram.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const diagram = getTeachingDiagramBySlug(slug);
  if (!diagram) return { title: "Diagram not found" };

  return {
    title: diagram.title,
    description: `${diagram.description} · ${SITE.name} instructor teaching diagram.`,
  };
}

export default async function InstructorDiagramDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { category: categoryRaw } = await searchParams;
  const diagram = getTeachingDiagramBySlug(slug);
  if (!diagram) notFound();

  const browseCategory = parseDiagramCategoryFilter(categoryRaw);
  const related = getRelatedTeachingDiagrams(diagram);
  const backHref = diagramLibraryHref(browseCategory);
  const backLabel =
    browseCategory === "all" ? "All diagrams" : getDiagramCategoryName(browseCategory);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-4">
      <div>
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          ← {backLabel}
        </Link>
      </div>

      <DiagramViewer title={diagram.title} image={diagram.image} Component={diagram.Component} />

      <DiagramDetailPanels diagram={diagram} related={related} browseCategory={browseCategory} />
    </div>
  );
}
