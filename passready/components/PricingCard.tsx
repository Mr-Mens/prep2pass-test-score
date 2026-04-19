type PricingCardProps = {
  price: string;
  title?: string;
  bullets: string[];
};

export function PricingCard({ price, title = "One-time premium report", bullets }: PricingCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-card sm:p-7">
      <p className="text-sm font-medium text-brand-600">{title}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-brand-950">{price}</p>
      <p className="mt-1 text-xs text-brand-500">Single payment · No subscription</p>
      <ul className="mt-5 space-y-2 text-sm text-brand-700">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span aria-hidden className="mt-0.5 text-brand-700">
              •
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
