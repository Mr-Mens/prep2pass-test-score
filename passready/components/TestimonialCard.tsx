type TestimonialCardProps = {
  quote: string;
  person: string;
  meta: string;
};

export function TestimonialCard({ quote, person, meta }: TestimonialCardProps) {
  return (
    <blockquote className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <p className="text-sm leading-relaxed text-brand-800">&ldquo;{quote}&rdquo;</p>
      <footer className="mt-4 text-xs text-brand-500">
        <span className="font-semibold text-brand-700">{person}</span> · {meta}
      </footer>
    </blockquote>
  );
}
