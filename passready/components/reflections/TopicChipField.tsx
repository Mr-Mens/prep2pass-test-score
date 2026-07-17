"use client";

import { useMemo, useState } from "react";

import { SYLLABUS_TOPIC_CATALOG } from "@/lib/syllabus-topics";

type Option = { id: string; label: string };

type Props = {
  label: string;
  options?: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  /** Slight visual lift for priority fields (e.g. next lesson focus). */
  emphasis?: boolean;
  /** Show syllabus categories with expand/collapse. */
  grouped?: boolean;
  /** Show these IDs first (e.g. topics practised this lesson). */
  preferredIds?: string[];
  preferredLabel?: string;
  hint?: string;
};

function Chip({
  option,
  active,
  emphasis,
  onToggle,
}: {
  option: Option;
  active: boolean;
  emphasis: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? emphasis
            ? "border-teal-700 bg-teal-700 text-white"
            : "border-teal-600 bg-teal-600 text-white"
          : emphasis
            ? "border-teal-200 bg-white text-brand-800 hover:border-teal-400 hover:bg-teal-50/70"
            : "border-brand-200 bg-white text-brand-700 hover:border-teal-300 hover:bg-teal-50/60"
      }`}
    >
      {option.label}
    </button>
  );
}

export function TopicChipField({
  label,
  options,
  selected,
  onChange,
  max = 8,
  emphasis = false,
  grouped = false,
  preferredIds = [],
  preferredLabel = "From this lesson",
  hint,
}: Props) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  const flatOptions = useMemo(() => {
    if (options && options.length > 0) return options;
    return SYLLABUS_TOPIC_CATALOG.flatMap((category) =>
      category.items.map((item) => ({ id: item.id, label: item.label })),
    );
  }, [options]);

  const optionById = useMemo(() => new Map(flatOptions.map((option) => [option.id, option])), [flatOptions]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, id]);
  }

  const preferredOptions = preferredIds
    .map((id) => optionById.get(id))
    .filter((option): option is Option => Boolean(option));

  const preferredSet = new Set(preferredIds);

  const shellClass = emphasis
    ? "rounded-xl border border-teal-200/60 bg-teal-50/30 p-4"
    : "";

  const header = (
    <>
      <p className={`text-sm font-semibold ${emphasis ? "text-teal-900" : "text-brand-950"}`}>{label}</p>
      {hint || emphasis ? (
        <p className={`mt-1 text-xs ${emphasis ? "text-teal-800/80" : "text-brand-500"}`}>
          {hint ?? (emphasis ? "Pick what to prioritise on your next drive." : null)}
        </p>
      ) : null}
      {selected.length > 0 ? (
        <p className="mt-1 text-xs text-brand-500">
          {selected.length}/{max} selected
        </p>
      ) : null}
    </>
  );

  if (!grouped) {
    return (
      <div className={shellClass || undefined}>
        {header}
        <div className="mt-3 flex flex-wrap gap-2">
          {flatOptions.map((option) => (
            <Chip
              key={option.id}
              option={option}
              active={selected.includes(option.id)}
              emphasis={emphasis}
              onToggle={() => toggle(option.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass || undefined}>
      {header}

      {preferredOptions.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">{preferredLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {preferredOptions.map((option) => (
              <Chip
                key={option.id}
                option={option}
                active={selected.includes(option.id)}
                emphasis={emphasis}
                onToggle={() => toggle(option.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {!showAll && preferredOptions.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs font-semibold text-teal-800 underline-offset-2 hover:underline"
          >
            Browse all topics
          </button>
        ) : null}

        {(showAll || preferredOptions.length === 0) &&
          SYLLABUS_TOPIC_CATALOG.map((category) => {
            const items = category.items
              .map((item) => optionById.get(item.id))
              .filter((option): option is Option => Boolean(option))
              .filter((option) => !preferredSet.has(option.id) || preferredOptions.length === 0);

            if (items.length === 0) return null;

            const isOpen =
              openCategories[category.key] ??
              (preferredOptions.length === 0 && category.key === SYLLABUS_TOPIC_CATALOG[0]?.key);
            const selectedInCategory = items.filter((item) => selected.includes(item.id)).length;

            return (
              <div key={category.key} className="rounded-xl border border-brand-100 bg-brand-50/30">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCategories((prev) => ({ ...prev, [category.key]: !isOpen }))
                  }
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-brand-900">{category.title}</span>
                  <span className="text-xs text-brand-500">
                    {selectedInCategory > 0 ? `${selectedInCategory} · ` : ""}
                    {isOpen ? "Hide" : "Show"}
                  </span>
                </button>
                {isOpen ? (
                  <div className="flex flex-wrap gap-2 border-t border-brand-100 px-3 py-3">
                    {items.map((option) => (
                      <Chip
                        key={option.id}
                        option={option}
                        active={selected.includes(option.id)}
                        emphasis={emphasis}
                        onToggle={() => toggle(option.id)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );
}
