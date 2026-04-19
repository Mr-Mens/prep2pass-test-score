import type { ReactNode } from "react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
};

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
      {icon ? (
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-brand-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-600">{description}</p>
    </div>
  );
}
