"use client";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

import {
  DiagramCaption,
  DirectionPath,
  LearnerCar,
  RoadSurface,
  UkRoadDiagramFrame,
  WhiteCentreLine,
  WhiteEdgeLine,
} from "@/components/instructor/diagrams/primitives/UkRoadShapes";

export function SatNavIndependentDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Independent driving following sat nav directions on UK roads">
      <RoadSurface d="M 120 250 L 680 250" />
      <RoadSurface d="M 400 250 L 400 420" width={70} />
      <WhiteEdgeLine d="M 120 206 L 680 206" />
      <WhiteEdgeLine d="M 120 294 L 680 294" />
      <WhiteCentreLine d="M 120 250 L 680 250" />
      <DirectionPath d="M 180 250 L 360 250 L 400 320 L 400 400" />
      <LearnerCar x={180} y={250} rotation={90} />
      <rect x={560} y={80} width="150" height="92" rx="12" fill="#0f172a" opacity="0.92" />
      <text x={635} y={118} textAnchor="middle" fill="#5eead4" fontSize="12" fontWeight="700">
        Sat nav
      </text>
      <text x={635} y={142} textAnchor="middle" fill="#f8fafc" fontSize="11">
        Turn left in 200 yds
      </text>
      <DiagramCaption x={120} y={450} text="Confirm direction · do not block traffic while checking" />
    </UkRoadDiagramFrame>
  );
}

export function FollowingSignsIndependentDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Independent driving by following UK direction signs">
      <RoadSurface d="M 120 250 L 680 250" />
      <RoadSurface d="M 400 250 L 400 80" width={70} />
      <WhiteEdgeLine d="M 120 206 L 680 206" />
      <WhiteEdgeLine d="M 120 294 L 680 294" />
      <WhiteCentreLine d="M 120 250 L 680 250" />
      <rect x={500} y={40} width="170" height="88" rx="10" fill="#0369a1" stroke="#0c4a6e" strokeWidth="3" />
      <text x={585} y={78} textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">
        Town centre
      </text>
      <text x={585} y={102} textAnchor="middle" fill="#e0f2fe" fontSize="12">
        ← left · ahead →
      </text>
      <DirectionPath d="M 180 250 L 360 250 L 400 170" />
      <LearnerCar x={180} y={250} rotation={90} />
      <DiagramCaption x={120} y={450} text="Read signs early · lane position · signal in good time" />
    </UkRoadDiagramFrame>
  );
}
