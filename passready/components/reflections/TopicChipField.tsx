"use client";

type Props = {
  label: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  /** Slight visual lift for priority fields (e.g. next lesson focus). */
  emphasis?: boolean;
};

export function TopicChipField({ label, options, selected, onChange, max = 8, emphasis = false }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, id]);
  }

  const content = (
    <>
      <p className={`text-sm font-semibold ${emphasis ? "text-teal-900" : "text-brand-950"}`}>{label}</p>
      {emphasis ? (
        <p className="mt-1 text-xs text-teal-800/80">Pick what to prioritise on your next drive.</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                active
                  ? emphasis
                    ? "border-teal-700 bg-teal-700 text-white shadow-sm ring-1 ring-teal-600/30"
                    : "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : emphasis
                    ? "border-teal-200/90 bg-white text-brand-800 hover:border-teal-400 hover:bg-teal-50/80"
                    : "border-brand-200 bg-white text-brand-700 hover:border-teal-300 hover:bg-teal-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </>
  );

  if (emphasis) {
    return (
      <div className="rounded-xl border border-teal-200/60 bg-gradient-to-br from-teal-50/50 to-white p-4 shadow-sm ring-1 ring-teal-100/70">
        {content}
      </div>
    );
  }

  return <div>{content}</div>;
}
