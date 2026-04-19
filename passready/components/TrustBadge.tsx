type TrustBadgeProps = {
  title: string;
  description: string;
};

export function TrustBadge({ title, description }: TrustBadgeProps) {
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-brand-950">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-brand-600">{description}</p>
    </div>
  );
}
