"use client";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

import {
  BelishaBeacon,
  DiagramCaption,
  DirectionPath,
  LearnerCar,
  RoadSurface,
  UkRoadDiagramFrame,
  WhiteCentreLine,
  WhiteEdgeLine,
  ZebraCrossingMarkings,
} from "@/components/instructor/diagrams/primitives/UkRoadShapes";

export function ZebraCrossingDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Zebra crossing with Belisha beacons on a UK road">
      <RoadSurface d="M 80 280 L 720 280" />
      <WhiteEdgeLine d="M 80 220 L 720 220" />
      <WhiteEdgeLine d="M 80 340 L 720 340" />
      <WhiteCentreLine d="M 80 280 L 720 280" />
      <ZebraCrossingMarkings x={340} y={262} width={120} />
      <BelishaBeacon cx={320} cy={280} />
      <BelishaBeacon cx={480} cy={280} />
      <DirectionPath d="M 180 280 L 300 280" />
      <LearnerCar x={180} y={280} rotation={90} />
      <DiagramCaption x={120} y={250} text="Be prepared to stop · no flashing lights" />
    </UkRoadDiagramFrame>
  );
}

export function PelicanCrossingDiagram(props: DiagramSvgProps) {
  return (
    <UkRoadDiagramFrame {...props} ariaLabel="Pelican crossing with UK push-button lights on a dual carriageway approach">
      <RoadSurface d="M 80 280 L 720 280" />
      <WhiteEdgeLine d="M 80 220 L 720 220" />
      <WhiteEdgeLine d="M 80 340 L 720 340" />
      <WhiteCentreLine d="M 80 280 L 720 280" />
      <ZebraCrossingMarkings x={360} y={262} width={100} />
      <rect x={560} y={170} width="28" height="72" rx="6" fill="#111827" />
      <circle cx={574} cy={190} r="10" fill="#ef4444" />
      <circle cx={574} cy={222} r="10" fill="#fbbf24" />
      <rect x={220} y={190} width="44" height="64" rx="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
      <text x={242} y={228} textAnchor="middle" fill="#334155" fontSize="11" fontWeight="700">
        WAIT
      </text>
      <LearnerCar x={180} y={280} rotation={90} />
      <DiagramCaption x={120} y={250} text="Flash amber: give way if pedestrians have crossed" />
    </UkRoadDiagramFrame>
  );
}
