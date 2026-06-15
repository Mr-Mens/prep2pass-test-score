"use client";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

import {
  DiagramCaption,
  DirectionPath,
  LearnerCar,
  OncomingCar,
  RoadSurface,
  UkRoadDiagramFrame,
  WhiteCentreLine,
  WhiteEdgeLine,
} from "@/components/instructor/diagrams/primitives/UkRoadShapes";

export function NarrowRoadMeetingDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Meeting oncoming traffic on a narrow UK road with left-hand priority">
      <RoadSurface d="M 400 80 L 400 420" width={56} />
      <WhiteEdgeLine d="M 372 80 L 372 420" />
      <WhiteEdgeLine d="M 428 80 L 428 420" />
      <DirectionPath d="M 400 380 L 400 220" />
      <DirectionPath d="M 400 120 L 400 260" />
      <LearnerCar x={400} y={380} rotation={0} />
      <OncomingCar x={400} y={120} rotation={180} />
      <DiagramCaption x={450} y={250} text="Assess gap · slow · hold position" />
      <DiagramCaption x={120} y={450} text="Use passing place if available" />
    </UkRoadDiagramFrame>
  );
}

export function PassingPlaceDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Using a UK passing place to give way to oncoming traffic">
      <RoadSurface d="M 400 80 L 400 420" width={56} />
      <RoadSurface d="M 428 220 L 520 220" width={42} />
      <WhiteEdgeLine d="M 372 80 L 372 420" />
      <WhiteEdgeLine d="M 428 80 L 428 420" />
      <DirectionPath d="M 400 360 L 470 280 L 470 220" />
      <LearnerCar x={470} y={220} rotation={90} />
      <OncomingCar x={400} y={120} rotation={180} />
      <DiagramCaption x={530} y={205} text="Passing place" />
      <DiagramCaption x={120} y={450} text="Wait in the place · not opposite it" />
    </UkRoadDiagramFrame>
  );
}
