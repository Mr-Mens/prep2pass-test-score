/**
 * Readiness score ring — visual accent only (scoring unchanged).
 */

type Props = {
  score: number;
  /** Outer box width/height (px). */
  size?: number;
  /** Thinner stroke for compact layouts */
  slim?: boolean;
  className?: string;
};

export function ScoreRingGauge({ score, size = 172, slim = false, className = "" }: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(score)));
  const stroke = slim ? 8 : 11;
  const pad = slim ? 2 : 4;
  const r = Math.max(8, size / 2 - stroke / 2 - pad);
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div
      role="img"
      aria-label={`Readiness score ${pct} out of 100`}
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e8eef6"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#0f766e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-1 text-center">
        <span className="font-heading text-[2.125rem] font-semibold tabular-nums leading-none tracking-tight text-brand-950 sm:text-4xl">
          {pct}
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-500">
          Score
        </span>
      </div>
    </div>
  );
}
