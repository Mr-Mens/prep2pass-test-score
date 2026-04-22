type FaqItemProps = {
  question: string;
  answer: string;
};

export function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <details className="group rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer list-none text-sm font-semibold text-brand-950">
        {question}
      </summary>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-700">{answer}</p>
    </details>
  );
}
