"use client";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

import {
  DiagramCaption,
  DirectionPath,
  GiveWayLine,
  GiveWaySign,
  LearnerCar,
  OncomingCar,
  RoadSurface,
  UkRoadDiagramFrame,
  WhiteCentreLine,
  WhiteEdgeLine,
} from "@/components/instructor/diagrams/primitives/UkRoadShapes";

export function TJunctionEmergingLeftDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="T-junction emerging left onto a priority road, UK left-hand traffic">
      <RoadSurface d="M 80 250 L 720 250" />
      <WhiteEdgeLine d="M 80 206 L 720 206" />
      <WhiteEdgeLine d="M 80 294 L 720 294" />
      <WhiteCentreLine d="M 80 250 L 720 250" />
      <RoadSurface d="M 400 250 L 400 470" width={70} />
      <WhiteEdgeLine d="M 365 250 L 365 470" />
      <WhiteEdgeLine d="M 435 250 L 435 470" />
      <GiveWayLine x1={365} y1={420} x2={435} y2={420} />
      <GiveWaySign cx={400} cy={390} />
      <DirectionPath d="M 400 440 C 400 360 340 300 260 250" />
      <LearnerCar x={400} y={440} rotation={0} />
      <OncomingCar x={560} y={250} rotation={90} />
      <DiagramCaption x={520} y={220} text="Priority road" />
      <DiagramCaption x={450} y={470} text="Side road" />
    </UkRoadDiagramFrame>
  );
}

export function CrossroadsPriorityDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Crossroads with a marked priority road in the UK">
      <RoadSurface d="M 80 250 L 720 250" />
      <RoadSurface d="M 400 80 L 400 420" width={70} />
      <WhiteEdgeLine d="M 80 206 L 720 206" />
      <WhiteEdgeLine d="M 80 294 L 720 294" />
      <WhiteEdgeLine d="M 365 80 L 365 420" />
      <WhiteEdgeLine d="M 435 80 L 435 420" />
      <WhiteCentreLine d="M 80 250 L 720 250" />
      <GiveWayLine x1={365} y1={300} x2={435} y2={300} />
      <GiveWayLine x1={365} y1={200} x2={435} y2={200} />
      <GiveWaySign cx={400} cy={330} />
      <GiveWaySign cx={400} cy={170} />
      <DirectionPath d="M 400 360 L 400 280" />
      <LearnerCar x={400} y={360} rotation={0} />
      <OncomingCar x={250} y={250} rotation={90} />
      <OncomingCar x={550} y={250} rotation={-90} />
      <DiagramCaption x={560} y={220} text="Priority road" />
    </UkRoadDiagramFrame>
  );
}

export function StaggeredJunctionDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Staggered junction with offset side roads in the UK">
      <RoadSurface d="M 80 250 L 720 250" />
      <RoadSurface d="M 320 250 L 320 470" width={64} />
      <RoadSurface d="M 520 250 L 520 70" width={64} />
      <WhiteEdgeLine d="M 80 206 L 720 206" />
      <WhiteEdgeLine d="M 80 294 L 720 294" />
      <WhiteCentreLine d="M 80 250 L 720 250" />
      <GiveWayLine x1={288} y1={420} x2={352} y2={420} />
      <GiveWayLine x1={488} y1={120} x2={552} y2={120} />
      <GiveWaySign cx={320} cy={390} />
      <GiveWaySign cx={520} cy={150} />
      <DirectionPath d="M 320 430 L 320 320 L 420 250" />
      <LearnerCar x={320} y={430} rotation={0} />
      <DiagramCaption x={560} y={220} text="Main road" />
      <DiagramCaption x={250} y={470} text="Staggered side roads" />
    </UkRoadDiagramFrame>
  );
}
