"use client";

type LiveStats = {
  counts: {
    minorFaultCount: number;
    seriousFaultCount: number;
    dangerousFaultCount: number;
  };
  outcome: "pass" | "fail" | "undecided";
  failReason: string | null;
};

type Props = {
  live: LiveStats;
  minorThreshold: number;
  onMinorThresholdChange: (value: number) => void;
  compact?: boolean;
};

export function MockTestLiveStatsBar({
  live,
  minorThreshold,
  onMinorThresholdChange,
  compact = false,
}: Props) {
  return (
    <div
      className={`grid gap-2 rounded-xl border border-brand-100 bg-white shadow-card ${
        compact ? "grid-cols-4 p-2" : "p-3 sm:grid-cols-2 md:grid-cols-4"
      }`}
    >
      <div>
        <p className="mock-sheet-eyebrow">Driving faults</p>
        <p className={compact ? "font-heading text-lg font-semibold tabular-nums text-brand-950" : "mock-sheet-stat-value"}>
          {live.counts.minorFaultCount}
        </p>
      </div>
      <div>
        <p className="mock-sheet-eyebrow">S / D</p>
        <p className={compact ? "font-heading text-lg font-semibold tabular-nums text-brand-950" : "mock-sheet-stat-value"}>
          {live.counts.seriousFaultCount} / {live.counts.dangerousFaultCount}
        </p>
      </div>
      <div>
        <p className="mock-sheet-eyebrow">Minor threshold</p>
        <input
          type="number"
          min={1}
          max={50}
          value={minorThreshold}
          onChange={(e) => onMinorThresholdChange(Math.min(50, Math.max(1, Number(e.target.value) || 15)))}
          className="mock-sheet-control-threshold"
        />
      </div>
      <div
        className={`rounded-lg px-2 py-1.5 text-sm font-semibold capitalize ${
          live.outcome === "pass"
            ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200"
            : live.outcome === "fail"
              ? "bg-red-50 text-red-950 ring-1 ring-red-200"
              : "bg-amber-50 text-amber-950 ring-1 ring-amber-200"
        }`}
      >
        <span className="font-heading tracking-tight">{live.outcome}</span>
        {live.failReason && !compact ? (
          <span className="mt-1 block font-sans text-xs font-normal leading-relaxed text-brand-600">{live.failReason}</span>
        ) : null}
      </div>
    </div>
  );
}
