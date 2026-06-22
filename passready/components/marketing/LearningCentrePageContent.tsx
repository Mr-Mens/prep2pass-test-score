import Link from "next/link";

import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { BRAND_CTA, PRODUCT, SMART_UI } from "@/lib/constants";
import { COMING_SOON_PLATFORM_MODULES, LIVE_PLATFORM_MODULES } from "@/lib/platform-navigation";
import { PLATFORM, PLATFORM_TERMS } from "@/lib/platform-copy";

function ModuleCard({
  label,
  description,
  status,
  href,
}: {
  label: string;
  description: string;
  status: "live" | "coming-soon";
  href?: string;
}) {
  const live = status === "live";

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm ${
        live
          ? "border-teal-200/70 bg-white ring-1 ring-teal-100/80"
          : "border-brand-100 bg-brand-50/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-brand-950">{label}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            live ? "bg-teal-100 text-teal-900" : "bg-brand-100 text-brand-600"
          }`}
        >
          {live ? "Available" : "Coming soon"}
        </span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-600">{description}</p>
      {live && href ? (
        <Link
          href={href}
          className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          Open module →
        </Link>
      ) : (
        <p className="mt-5 text-xs font-medium text-brand-500">Launching as part of the {PRODUCT.name} platform.</p>
      )}
    </article>
  );
}

export function LearningCentrePageContent() {
  return (
    <>
      <Section className="border-b border-brand-100/80 bg-gradient-to-b from-teal-50/30 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
            {PLATFORM_TERMS.learningCentre}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            {PLATFORM_TERMS.resources} for every stage of the journey
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-700">{PLATFORM.heroSubheading}</p>
          <p className="mt-3 text-sm text-brand-600">{PLATFORM.category}</p>
        </div>
      </Section>

      <Section eyebrow="Available now" title={`Live ${PLATFORM_TERMS.coachingTools} and learning modules`}>
        <div className="grid gap-4 md:grid-cols-2">
          {LIVE_PLATFORM_MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              label={module.label}
              description={module.description}
              status={module.status}
              href={module.href}
            />
          ))}
        </div>
      </Section>

      <Section
        className="bg-brand-50/40"
        eyebrow="Roadmap"
        title="Expanding the platform"
        subtitle="Pass Pilot is growing into a long-term driving education ecosystem."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COMING_SOON_PLATFORM_MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              label={module.label}
              description={module.description}
              status={module.status}
            />
          ))}
        </div>
      </Section>

      <Section className="text-center">
        <h2 className="font-heading text-2xl font-semibold text-brand-950">Start with your Pass Pilot Score</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-600">
          Your {PLATFORM_TERMS.learningJourney} begins with structured assessment, {SMART_UI.personalisedReports.toLowerCase()} and{" "}
          {SMART_UI.insights.toLowerCase()}.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/assessment" variant="conversion">
            {BRAND_CTA.getMyScore}
          </Button>
          <Button href="/sample-report" variant="secondary">
            {BRAND_CTA.viewSampleReport}
          </Button>
        </div>
      </Section>
    </>
  );
}
