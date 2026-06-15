"use client";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

import {
  DiagramCaption,
  DirectionPath,
  LearnerCar,
  OncomingCar,
  ParkingBayLines,
  RoadSurface,
  UkRoadDiagramFrame,
  WhiteCentreLine,
  WhiteEdgeLine,
} from "@/components/instructor/diagrams/primitives/UkRoadShapes";

export function ParallelParkDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Parallel park beside a parked vehicle on a UK road">
      <RoadSurface d="M 80 300 L 720 300" />
      <WhiteEdgeLine d="M 80 240 L 720 240" />
      <WhiteEdgeLine d="M 80 360 L 720 360" />
      <WhiteCentreLine d="M 80 300 L 720 300" />
      <rect x="500" y="250" width="120" height="50" rx="8" fill="#64748b" stroke="#334155" strokeWidth="2" />
      <DirectionPath d="M 260 300 L 360 300 L 420 340 L 470 340 L 520 340" />
      <LearnerCar x={260} y={300} rotation={90} />
      <DiagramCaption x={500} y={235} text="Parked vehicle" />
      <DiagramCaption x={120} y={270} text="MSPSL · observations · slow control" />
    </UkRoadDiagramFrame>
  );
}

export function ForwardBayParkDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Forward bay park using UK bay markings">
      <RoadSurface d="M 80 360 L 720 360" />
      <WhiteEdgeLine d="M 80 300 L 720 300" />
      <WhiteEdgeLine d="M 80 420 L 720 420" />
      <ParkingBayLines x={480} y={250} count={3} />
      <DirectionPath d="M 220 360 L 420 360 L 500 310" />
      <LearnerCar x={220} y={360} rotation={90} />
      <DiagramCaption x={500} y={230} text="Bay markings" />
      <DiagramCaption x={120} y={330} text="Position · signal · line up early" />
    </UkRoadDiagramFrame>
  );
}

export function PullUpOnRightDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Pull up on the right, reverse, and rejoin in UK traffic">
      <RoadSurface d="M 80 280 L 720 280" />
      <WhiteEdgeLine d="M 80 220 L 720 220" />
      <WhiteEdgeLine d="M 80 340 L 720 340" />
      <WhiteCentreLine d="M 80 280 L 720 280" />
      <DirectionPath d="M 260 280 L 520 280 L 560 320 L 560 380 L 520 420 L 260 420 L 220 380 L 220 320 Z" />
      <LearnerCar x={260} y={280} rotation={90} />
      <OncomingCar x={620} y={280} rotation={-90} />
      <DiagramCaption x={120} y={250} text="Pull up on the right safely" />
      <DiagramCaption x={430} y={450} text="Reverse 2 car lengths · rejoin with observations" />
    </UkRoadDiagramFrame>
  );
}
