"use client";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

import {
  DiagramCaption,
  DirectionPath,
  LaneArrow,
  LearnerCar,
  OncomingCar,
  RoadSurface,
  RoundaboutRing,
  UkRoadDiagramFrame,
  WhiteCentreLine,
  WhiteEdgeLine,
} from "@/components/instructor/diagrams/primitives/UkRoadShapes";

export function MiniRoundaboutDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Mini roundabout with correct left-hand circulation in the UK">
      <RoadSurface d="M 120 250 L 320 250" />
      <RoadSurface d="M 480 250 L 680 250" />
      <RoadSurface d="M 400 250 L 400 80" width={64} />
      <RoadSurface d="M 400 250 L 400 420" width={64} />
      <RoundaboutRing cx={400} cy={250} r={42} />
      <WhiteEdgeLine d="M 120 206 L 320 206" />
      <WhiteEdgeLine d="M 480 206 L 680 206" />
      <WhiteCentreLine d="M 120 250 L 280 250" />
      <WhiteCentreLine d="M 520 250 L 680 250" />
      <DirectionPath d="M 400 380 C 360 340 330 300 330 250 C 330 210 350 180 400 170" />
      <LearnerCar x={400} y={380} rotation={0} />
      <DiagramCaption x={250} y={220} text="Give way to the right" />
    </UkRoadDiagramFrame>
  );
}

export function StandardRoundaboutApproachDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Multi-lane approach to a standard UK roundabout">
      <RoadSurface d="M 120 250 L 300 250" width={120} />
      <RoadSurface d="M 500 250 L 680 250" width={120} />
      <RoadSurface d="M 400 250 L 400 80" width={100} />
      <RoundaboutRing cx={400} cy={250} r={70} />
      <WhiteEdgeLine d="M 120 190 L 300 190" />
      <WhiteEdgeLine d="M 120 310 L 300 310" />
      <WhiteCentreLine d="M 120 250 L 280 250" />
      <LaneArrow x={220} y={230} direction="left" />
      <LaneArrow x={220} y={270} direction="ahead" />
      <DirectionPath d="M 220 290 L 280 250 C 300 230 330 210 360 210" />
      <LearnerCar x={220} y={290} rotation={0} />
      <OncomingCar x={560} y={250} rotation={90} />
      <DiagramCaption x={130} y={160} text="Check lane markings early" />
    </UkRoadDiagramFrame>
  );
}

export function RoundaboutSignallingExitDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Signalling left after passing the exit before yours on a UK roundabout">
      <RoundaboutRing cx={400} cy={250} r={68} />
      <RoadSurface d="M 120 250 L 300 250" />
      <RoadSurface d="M 500 250 L 680 250" />
      <RoadSurface d="M 400 250 L 400 80" width={70} />
      <RoadSurface d="M 400 250 L 400 420" width={70} />
      <DirectionPath d="M 180 250 C 260 250 300 230 330 210 C 350 195 365 180 380 160" />
      <LearnerCar x={180} y={250} rotation={90} />
      <DiagramCaption x={500} y={220} text="Exit 2" />
      <DiagramCaption x={410} y={90} text="Exit 3 (yours)" />
      <DiagramCaption x={410} y={450} text="Exit 1" />
      <DiagramCaption x={130} y={210} text="Signal left after exit before yours" />
    </UkRoadDiagramFrame>
  );
}
