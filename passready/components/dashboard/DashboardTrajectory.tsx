import { formatCompactDateUk } from "@/lib/formatting";

import type { JourneySnapshot } from "@/lib/dashboard/journey-types";

type CanvasPt = { x: number; y: number; score: number; dateShort: string };

function catmullRomBezierPath(pts: CanvasPt[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function trajIdSafe(uid: string): string {
  return `tj${uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "x"}`;
}

function labelSlots(n: number): Set<number> {
  if (n <= 6) return new Set(Array.from({ length: n }, (_, i) => i));
  const s = new Set([0, n - 1, Math.floor(n / 3), Math.floor((2 * n) / 3)]);
  while (s.size < 6) {
    let add = Array.from(s).reduce((acc, cur) => acc + cur, 0);
    add = Math.max(1, Math.min(n - 2, Math.floor(add / Math.max(s.size, 4))));
    if (s.has(add)) break;
    s.add(add);
  }
  return s;
}

type Props = {
  snapshotsChrono: JourneySnapshot[];
  userIdForIds: string;
  className?: string;
};

/** Curved readiness arc with glow stroke and labelled milestones (journey framing, calm analytics). */
export function DashboardTrajectory({ snapshotsChrono, userIdForIds, className = "" }: Props) {
  const gid = trajIdSafe(userIdForIds);

  if (snapshotsChrono.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-white/38 bg-white/[0.06] px-4 py-8 text-center text-sm leading-relaxed text-slate-200 ${className}`.trim()}
      >
        Your arc appears once a Premium save lands on this account.
      </div>
    );
  }

  const w = 720;
  const h = 200;
  const padX = 32;
  const padTop = 22;
  const padBottom = 48;
  const plotW = w - padX * 2;
  const plotH = h - padTop - padBottom;

  const nodes: CanvasPt[] = snapshotsChrono.map((snap, idx) => {
    const divisor = snapshotsChrono.length <= 1 ? 1 : snapshotsChrono.length - 1;
    const frac = divisor === 0 ? 0 : idx / divisor;
    return {
      x: padX + frac * plotW,
      score: snap.readiness_score,
      dateShort: formatCompactDateUk(snap.created_at),
      y: 0, // filled after min/max bands
    };
  });

  const scores = snapshotsChrono.map((s) => s.readiness_score);
  let bandMin = Math.min(...scores);
  let bandMax = Math.max(...scores);
  const padBand = Math.max(5, Math.round((bandMax - bandMin) * 0.2));
  bandMin = Math.max(0, Math.floor(bandMin - padBand));
  bandMax = Math.min(100, Math.ceil(bandMax + padBand));
  const span = bandMax - bandMin || 1;

  for (let i = 0; i < nodes.length; i++) {
    const s = snapshotsChrono[i]!.readiness_score;
    nodes[i]!.y = padTop + plotH * (1 - (s - bandMin) / span);
  }

  const spline: CanvasPt[] =
    snapshotsChrono.length >= 2 ? nodes : [nodes[0]!, { ...nodes[0]!, x: padX + plotW, y: nodes[0]!.y }];

  const curvePath = catmullRomBezierPath(spline);
  const firstX = spline[0]!.x;
  const lastX = spline[spline.length - 1]!.x;
  const bottomFillY = h - 18;
  const areaPath = `${curvePath} L ${lastX} ${bottomFillY} L ${firstX} ${bottomFillY} Z`;

  const labelIdx = labelSlots(snapshotsChrono.length);
  const ariaLabel = `Readiness trajectory across ${snapshotsChrono.length} saved report${snapshotsChrono.length === 1 ? "" : "s"}. Dates mark each assessment.`;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" role="img" aria-label={ariaLabel} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`${gid}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ccfbf1" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
          <linearGradient id={`${gid}-area`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.36} />
            <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-55%" y="-55%" width="210%" height="210%">
            <feGaussianBlur stdDeviation={4} />
          </filter>
        </defs>

        <path d={areaPath} fill={`url(#${gid}-area)`} />

        <path
          d={curvePath}
          fill="none"
          stroke="rgb(207,250,229)"
          strokeOpacity={0.42}
          strokeWidth={13}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${gid}-glow)`}
        />
        <path
          d={curvePath}
          fill="none"
          stroke={`url(#${gid}-stroke)`}
          strokeWidth={2.95}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {nodes.map((pt, i) => (
          <g key={`node-${snapshotsChrono[i]!.id}`}>
            <circle cx={pt.x} cy={pt.y} r={6} fill="#ecfdf9" stroke="#0f766e" strokeWidth={2} />
            {labelIdx.has(i) ? (
              <text
                x={pt.x}
                y={Math.min(pt.y + 28, h - 6)}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={11}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                style={{ letterSpacing: "0.02em" }}
              >
                {pt.dateShort}
                <title>{`${pt.score}/100`}</title>
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <p className="sr-only">{`Bands ${bandMin}-${bandMax} for visual contrast.`}</p>
    </div>
  );
}
