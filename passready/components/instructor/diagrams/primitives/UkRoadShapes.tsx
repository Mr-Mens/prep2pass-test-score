"use client";

import { createContext, useContext, useId, type ReactNode } from "react";

import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

const ArrowMarkerContext = createContext<string>("uk-arrow-default");

type FrameProps = DiagramSvgProps & {
  children: ReactNode;
  ariaLabel: string;
};

export function UkRoadDiagramFrame({ className, variant = "full", ariaLabel, children }: FrameProps) {
  const uid = useId().replace(/:/g, "");
  const markerId = `${uid}-arrow`;
  const viewBox = variant === "thumbnail" ? "0 0 800 500" : "0 0 800 500";
  return (
    <ArrowMarkerContext.Provider value={markerId}>
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={ariaLabel}
        className={className ?? "h-auto w-full"}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="800" height="500" fill="#eef2f6" />
        <rect x="0" y="0" width="800" height="500" fill={`url(#${uid}-grid)`} opacity="0.35" />
        <defs>
          <pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.75" />
          </pattern>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#0f766e" />
          </marker>
        </defs>
        {children}
      </svg>
    </ArrowMarkerContext.Provider>
  );
}

export function RoadSurface({
  d,
  width = 88,
  fill = "#475569",
}: {
  d: string;
  width?: number;
  fill?: string;
}) {
  return <path d={d} fill="none" stroke={fill} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
}

export function WhiteEdgeLine({ d }: { d: string }) {
  return <path d={d} fill="none" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />;
}

export function WhiteCentreLine({ d, dashed = true }: { d: string; dashed?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="#f8fafc"
      strokeWidth="2.5"
      strokeDasharray={dashed ? "16 14" : undefined}
      strokeLinecap="round"
    />
  );
}

export function GiveWayLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#f8fafc"
      strokeWidth="4"
      strokeDasharray="10 8"
      strokeLinecap="round"
    />
  );
}

export function DirectionPath({ d, label }: { d: string; label?: string }) {
  const markerId = useContext(ArrowMarkerContext);
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke="#0f766e"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        opacity="0.95"
      />
      {label ? (
        <text x="24" y="36" fill="#0f766e" fontSize="14" fontWeight="600">
          {label}
        </text>
      ) : null}
    </>
  );
}

export function GiveWaySign({ cx, cy, size = 34 }: { cx: number; cy: number; size?: number }) {
  const h = (size * Math.sqrt(3)) / 2;
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <path d={`M0 ${-h / 2} L${size / 2} ${h / 2} L${-size / 2} ${h / 2} Z`} fill="#ffffff" stroke="#dc2626" strokeWidth="3" />
      <text textAnchor="middle" y={h / 2 - 8} fill="#111827" fontSize="9" fontWeight="700">
        GIVE WAY
      </text>
    </g>
  );
}

export function SpeedLimitSign({ cx, cy, limit }: { cx: number; cy: number; limit: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="22" fill="#ffffff" stroke="#dc2626" strokeWidth="4" />
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#111827" fontSize="14" fontWeight="700">
        {limit}
      </text>
    </g>
  );
}

export function LearnerCar({
  x,
  y,
  rotation = 0,
  label = "You",
}: {
  x: number;
  y: number;
  rotation?: number;
  label?: string;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <rect x="-16" y="-28" width="32" height="56" rx="8" fill="#0e7490" stroke="#083344" strokeWidth="2" />
      <rect x="-12" y="-18" width="24" height="16" rx="3" fill="#bae6fd" opacity="0.9" />
      <rect x="-12" y="6" width="24" height="12" rx="3" fill="#bae6fd" opacity="0.9" />
      <text x="0" y="-36" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

export function OncomingCar({ x, y, rotation = 0 }: { x: number; y: number; rotation?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <rect x="-14" y="-24" width="28" height="48" rx="7" fill="#64748b" stroke="#334155" strokeWidth="2" />
    </g>
  );
}

export function DiagramCaption({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} fill="#334155" fontSize="13" fontWeight="600">
      {text}
    </text>
  );
}

export function ZebraCrossingMarkings({ x, y, width = 120 }: { x: number; y: number; width?: number }) {
  const stripes = 8;
  const stripeWidth = width / (stripes * 2 - 1);
  return (
    <g>
      {Array.from({ length: stripes }).map((_, i) => (
        <rect
          key={i}
          x={x + i * stripeWidth * 2}
          y={y}
          width={stripeWidth}
          height="36"
          fill="#f8fafc"
          opacity="0.95"
        />
      ))}
      <rect x={x - 8} y={y - 6} width={width + 16} height="48" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" />
    </g>
  );
}

export function BelishaBeacon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 4} y={cy - 28} width="8" height="56" fill="#64748b" />
      <circle cx={cx} cy={cy - 18} r="10" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
      <circle cx={cx} cy={cy + 18} r="10" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
    </g>
  );
}

export function RoundaboutRing({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r + 36} fill="#475569" />
      <circle cx={cx} cy={cy} r={r} fill="#eef2f6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f8fafc" strokeWidth="3" strokeDasharray="10 8" />
    </>
  );
}

export function LaneArrow({ x, y, direction }: { x: number; y: number; direction: "left" | "ahead" | "right" }) {
  const paths = {
    left: "M0 0 L-16 0 M-16 0 L-8 -8 M-16 0 L-8 8",
    ahead: "M0 0 L0 -18 M0 -18 L-7 -10 M0 -18 L7 -10",
    right: "M0 0 L16 0 M16 0 L8 -8 M16 0 L8 8",
  };
  return (
    <g transform={`translate(${x}, ${y})`} stroke="#f8fafc" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d={paths[direction]} />
    </g>
  );
}

export function ParkingBayLines({ x, y, count = 3 }: { x: number; y: number; count?: number }) {
  return (
    <g stroke="#f8fafc" strokeWidth="2.5">
      {Array.from({ length: count + 1 }).map((_, i) => (
        <line key={i} x1={x + i * 42} y1={y} x2={x + i * 42} y2={y + 90} />
      ))}
      <line x1={x} y1={y} x2={x + count * 42} y2={y} />
      <line x1={x} y1={y + 90} x2={x + count * 42} y2={y + 90} />
    </g>
  );
}
