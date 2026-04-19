import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
  contentClassName = "",
}: SectionProps) {
  return (
    <section id={id} className={`py-20 sm:py-24 ${className}`.trim()}>
      <div className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${contentClassName}`.trim()}>
        {(eyebrow || title || subtitle) && (
          <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-14">
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-3 font-heading text-balance text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-4 text-pretty text-base leading-relaxed text-brand-600 sm:text-lg">
                {subtitle}
              </p>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
