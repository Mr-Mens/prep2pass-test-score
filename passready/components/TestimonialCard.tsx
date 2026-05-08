type TestimonialCardProps = {
  quote: string;
  /** When omitted (e.g. use-case examples), no attribution line is shown. */
  person?: string;
  /** Optional supporting line (e.g. location). Omitted when empty. */
  meta?: string;
};

export function TestimonialCard({ quote, person, meta }: TestimonialCardProps) {
  return (
    <blockquote className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <p className="text-sm leading-relaxed text-brand-800">&ldquo;{quote}&rdquo;</p>
      {person ? (
        <footer className="mt-4 text-xs text-brand-500">
          <span className="font-semibold text-brand-700">{person}</span>
          {meta ? <span> · {meta}</span> : null}
        </footer>
      ) : null}
    </blockquote>
  );
}
