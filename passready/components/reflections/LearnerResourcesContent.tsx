import Link from "next/link";

import { Button } from "@/components/Button";
import { BRAND_CTA, PRODUCT } from "@/lib/constants";
import {
  comingSoonModulesForAudience,
  liveModulesForAudience,
  type PlatformModuleAudience,
} from "@/lib/platform-navigation";
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
      className={`flex h-full flex-col rounded-2xl border p-5 shadow-sm ${
        live ? "border-teal-200/70 bg-white ring-1 ring-teal-100/80" : "border-brand-100 bg-brand-50/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-base font-semibold text-brand-950 sm:text-lg">{label}</h2>
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
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          Open →
        </Link>
      ) : (
        <p className="mt-4 text-xs font-medium text-brand-500">Launching on {PRODUCT.name}.</p>
      )}
    </article>
  );
}

export function LearnerResourcesContent({ audience = "learner" }: { audience?: PlatformModuleAudience }) {
  const liveModules = liveModulesForAudience(audience);
  const comingSoonModules = comingSoonModulesForAudience(audience);
  const reflectionsHref = audience === "supervisor" ? "/supervisor/reflections" : "/dashboard/reflections";

  return (
    <div className="space-y-8 pb-4">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">{PLATFORM_TERMS.resources}</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          Tools and guides for your journey
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-600">{PLATFORM.heroSubheading}</p>
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Available now</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {liveModules.map((module) => (
            <ModuleCard
              key={module.id}
              label={module.label}
              description={module.description}
              status={module.status}
              href={module.href}
            />
          ))}
          <ModuleCard
            label="Lesson Reflections"
            description="Log each lesson in under two minutes and build confidence trends over time."
            status="live"
            href={reflectionsHref}
          />
        </div>
      </section>

      {comingSoonModules.length > 0 ? (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Coming soon</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {comingSoonModules.map((module) => (
            <ModuleCard
              key={module.id}
              label={module.label}
              description={module.description}
              status={module.status}
            />
          ))}
        </div>
      </section>
      ) : null}

      {audience === "learner" ? (
      <section className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 sm:p-6">
        <p className="font-heading text-lg font-semibold text-brand-950">Need your latest score?</p>
        <p className="mt-2 text-sm text-brand-700">Run a fresh Test Ready Score when your practice has moved on.</p>
        <Button href="/assessment" variant="conversion" className="mt-4 min-h-[48px]">
          {BRAND_CTA.updateMyScore}
        </Button>
      </section>
      ) : null}
    </div>
  );
}
