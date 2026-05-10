"use client";

import { MINOR_TALLY_CAP } from "@/lib/instructor/mock-test-scoring";
import type { FaultMarks } from "@/lib/instructor/types";

type Props = {
  value: FaultMarks;
  onChange: (next: FaultMarks) => void;
  disabled?: boolean;
  /** Tighter controls for dense / multi-column fault grids. */
  compact?: boolean;
};

/**
 * DL25-inspired: circle tallies driving (minor) faults per tap; S / D toggle serious / dangerous.
 */
export function MockTestFaultControls({ value, onChange, disabled, compact }: Props) {
  const { minorCount, serious, dangerous } = value;
  const escalatesToSerious = minorCount > MINOR_TALLY_CAP;

  function bumpMinor(delta: number) {
    onChange({
      ...value,
      minorCount: Math.min(99, Math.max(0, minorCount + delta)),
    });
  }

  const c = compact;
  const circleSize = c ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  const btnSize = c ? "h-8 min-h-[32px] w-8 min-w-[32px] text-xs" : "h-10 min-h-[40px] w-10 min-w-[40px] text-sm";
  const gridGap = c ? "gap-1 sm:gap-1.5" : "gap-2 sm:gap-2.5";
  const colTemplate = c ? "grid-cols-[2.25rem_2rem_2rem]" : "grid-cols-[2.75rem_2.5rem_2.5rem]";

  return (
    <div
      className={`inline-grid ${colTemplate} ${gridGap} items-start justify-items-center`}
      role="group"
      aria-label="Fault marks: minors in circle, S serious, D dangerous"
    >
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          disabled={disabled}
          title={
            escalatesToSerious
              ? `${MINOR_TALLY_CAP + 1}+ minors on this line count as a serious fault`
              : "Driving fault (minor) — tap once per fault"
          }
          onClick={() => bumpMinor(1)}
          className={`flex shrink-0 items-center justify-center rounded-full border-2 font-heading font-semibold tabular-nums transition ${circleSize} ${
            escalatesToSerious
              ? "border-orange-400 bg-orange-50 text-orange-950 shadow-inner ring-2 ring-orange-200"
              : minorCount > 0
                ? "border-teal-600 bg-teal-50 text-teal-950 shadow-inner"
                : "border-brand-200 bg-white text-brand-400 hover:border-teal-300 hover:bg-teal-50/50"
          } ${disabled ? "opacity-40" : "active:scale-95"}`}
        >
          {minorCount > 0 ? minorCount : <span className={`leading-none text-brand-300 ${c ? "text-sm" : "text-base"}`}>○</span>}
        </button>
        {minorCount > 0 ? (
          <button
            type="button"
            disabled={disabled}
            className="text-xs font-medium text-brand-600 underline-offset-2 hover:text-brand-900 hover:underline disabled:opacity-40"
            onClick={() => bumpMinor(-1)}
          >
            −1
          </button>
        ) : (
          <span className={`${c ? "h-3" : "h-3.5"}`} aria-hidden />
        )}
        {escalatesToSerious ? (
          <span className="max-w-[5rem] text-center text-xs font-medium leading-tight text-orange-900">
            Counts as serious
          </span>
        ) : null}
      </div>

      <button
        type="button"
        disabled={disabled}
        title="Serious fault"
        onClick={() => onChange({ ...value, serious: !serious })}
        className={`mt-0.5 flex items-center justify-center rounded-md border font-heading font-semibold transition ${btnSize} ${
          serious || escalatesToSerious
            ? "border-orange-500 bg-orange-500 text-white shadow-sm"
            : "border-brand-200 bg-white text-brand-600 hover:border-orange-300 hover:bg-orange-50"
        } ${disabled ? "opacity-40" : ""}`}
      >
        S
      </button>
      <button
        type="button"
        disabled={disabled}
        title="Dangerous fault"
        onClick={() => onChange({ ...value, dangerous: !dangerous })}
        className={`mt-0.5 flex items-center justify-center rounded-md border font-heading font-semibold transition ${btnSize} ${
          dangerous
            ? "border-red-600 bg-red-600 text-white shadow-sm"
            : "border-brand-200 bg-white text-brand-600 hover:border-red-300 hover:bg-red-50"
        } ${disabled ? "opacity-40" : ""}`}
      >
        D
      </button>
    </div>
  );
}
