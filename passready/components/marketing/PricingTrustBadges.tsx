type Props = {
  className?: string;
};

const items = [
  "No long-term contract",
  "Cancel anytime",
  "Record your pass and we'll automatically stop future billing",
] as const;

/** Prominent pricing trust badges, keep all three visible together. */
export function PricingTrustBadges({ className = "" }: Props) {
  return (
    <ul
      className={`space-y-2.5 rounded-xl border border-teal-200/80 bg-teal-50/70 px-4 py-3.5 ring-1 ring-teal-100/80 sm:px-5 sm:py-4 ${className}`}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-left text-sm leading-snug text-teal-950">
          <span className="mt-0.5 shrink-0 font-bold text-teal-600" aria-hidden>
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
