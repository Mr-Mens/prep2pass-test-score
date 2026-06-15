"use client";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

import {
  DiagramCaption,
  DirectionPath,
  LearnerCar,
  OncomingCar,
  RoadSurface,
  SpeedLimitSign,
  UkRoadDiagramFrame,
  WhiteCentreLine,
  WhiteEdgeLine,
} from "@/components/instructor/diagrams/primitives/UkRoadShapes";

export function JoiningSlipRoadDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Joining a UK dual carriageway from a slip road">
      <RoadSurface d="M 80 220 L 720 220" width={110} />
      <RoadSurface d="M 80 320 L 720 320" width={110} />
      <RoadSurface d="M 120 420 L 260 320" width={70} />
      <WhiteEdgeLine d="M 80 165 L 720 165" />
      <WhiteEdgeLine d="M 80 275 L 720 275" />
      <WhiteEdgeLine d="M 80 375 L 720 375" />
      <WhiteCentreLine d="M 80 220 L 720 220" />
      <WhiteCentreLine d="M 80 320 L 720 320" />
      <DirectionPath d="M 140 400 L 220 340 L 300 320" />
      <LearnerCar x={140} y={400} rotation={-35} />
      <OncomingCar x={520} y={320} rotation={90} />
      <SpeedLimitSign cx={640} cy={140} limit="70" />
      <DiagramCaption x={120} y={450} text="Match speed · observations · merge when safe" />
    </UkRoadDiagramFrame>
  );
}

export function OvertakingReturnDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Overtaking on a UK dual carriageway and returning to the left lane">
      <RoadSurface d="M 80 220 L 720 220" width={110} />
      <RoadSurface d="M 80 320 L 720 320" width={110} />
      <WhiteEdgeLine d="M 80 165 L 720 165" />
      <WhiteEdgeLine d="M 80 275 L 720 275" />
      <WhiteEdgeLine d="M 80 375 L 720 375" />
      <WhiteCentreLine d="M 80 220 L 720 220" dashed />
      <WhiteCentreLine d="M 80 320 L 720 320" dashed />
      <OncomingCar x={560} y={220} rotation={90} />
      <rect x="300" y="285" width="90" height="40" rx="8" fill="#64748b" />
      <DirectionPath d="M 220 320 L 360 320 L 420 260 L 520 260 L 560 320" />
      <LearnerCar x={220} y={320} rotation={90} />
      <DiagramCaption x={120} y={390} text="Mirror · signal · manoeuvre · return left" />
    </UkRoadDiagramFrame>
  );
}
