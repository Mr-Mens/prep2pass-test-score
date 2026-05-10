/** DVSA-style structure labels only — independent prep tool, not affiliated with DVSA. */

import type { FaultMarks } from "@/lib/instructor/types";

export type FaultRowDef = { id: string; label: string };

/** Payload keys that store ○ / S / D fault rows */
export type FaultSectionKey =
  | "manoeuvres"
  | "showMeTellMe"
  | "controlledStop"
  | "control"
  | "moveOff"
  | "mirrors"
  | "signals"
  | "junctions"
  | "judgement"
  | "positioningCore"
  | "progress"
  | "responseSigns";

export type FaultSectionDef = {
  key: FaultSectionKey;
  title: string;
  hint?: string;
  rows: FaultRowDef[];
};

const SHOW_ME: FaultSectionDef = {
  key: "showMeTellMe",
  title: "Show me / Tell me",
  rows: [{ id: "item", label: "Show me / Tell me" }],
};

const CONTROLLED_STOP: FaultSectionDef = {
  key: "controlledStop",
  title: "Controlled stop",
  rows: [{ id: "item", label: "Controlled stop" }],
};

const CONTROL: FaultSectionDef = {
  key: "control",
  title: "Control",
  rows: [
    { id: "accelerator", label: "Accelerator" },
    { id: "clutch", label: "Clutch" },
    { id: "gears", label: "Gears" },
    { id: "footbrake", label: "Footbrake" },
    { id: "parkingBrake", label: "Parking brake" },
    { id: "steering", label: "Steering" },
    { id: "precautions", label: "Precautions" },
    { id: "ancillaryControls", label: "Ancillary controls" },
  ],
};

const MOVE_OFF: FaultSectionDef = {
  key: "moveOff",
  title: "Move off",
  rows: [
    { id: "safety", label: "Safety" },
    { id: "control", label: "Control" },
  ],
};

const MIRRORS: FaultSectionDef = {
  key: "mirrors",
  title: "Use of mirrors",
  rows: [
    { id: "signalling", label: "Signalling" },
    { id: "changeDirection", label: "Change direction" },
    { id: "changeSpeed", label: "Change speed" },
  ],
};

const SIGNALS: FaultSectionDef = {
  key: "signals",
  title: "Signals",
  rows: [
    { id: "necessary", label: "Necessary" },
    { id: "correctly", label: "Correctly" },
    { id: "timed", label: "Timed" },
  ],
};

const JUNCTIONS: FaultSectionDef = {
  key: "junctions",
  title: "Junctions",
  rows: [
    { id: "approachSpeed", label: "Approach speed" },
    { id: "observation", label: "Observation" },
    { id: "turningRight", label: "Turning right" },
    { id: "turningLeft", label: "Turning left" },
    { id: "cuttingCorners", label: "Cutting corners" },
  ],
};

const JUDGEMENT: FaultSectionDef = {
  key: "judgement",
  title: "Judgement",
  rows: [
    { id: "overtaking", label: "Overtaking" },
    { id: "meeting", label: "Meeting" },
    { id: "crossing", label: "Crossing" },
  ],
};

const POSITIONING_CORE: FaultSectionDef = {
  key: "positioningCore",
  title: "Positioning",
  hint: "Normal driving and lane discipline.",
  rows: [
    { id: "normalDriving", label: "Normal driving" },
    { id: "laneDiscipline", label: "Lane discipline" },
    { id: "pedCrossings", label: "Pedestrian crossings" },
    { id: "normalStop", label: "Position / normal stop" },
    { id: "awarenessPlanning", label: "Awareness / planning" },
    { id: "clearance", label: "Clearance" },
    { id: "followingDistance", label: "Following distance" },
    { id: "useOfSpeed", label: "Use of speed" },
  ],
};

const PROGRESS: FaultSectionDef = {
  key: "progress",
  title: "Progress",
  rows: [
    { id: "appropriateSpeed", label: "Appropriate speed" },
    { id: "undueHesitation", label: "Undue hesitation" },
  ],
};

const RESPONSE_SIGNS: FaultSectionDef = {
  key: "responseSigns",
  title: "Response to signs / signals",
  rows: [
    { id: "trafficSigns", label: "Traffic signs" },
    { id: "roadMarkings", label: "Road markings" },
    { id: "trafficLights", label: "Traffic lights" },
    { id: "trafficControllers", label: "Traffic controllers" },
    { id: "otherRoadUsers", label: "Other road users" },
  ],
};

const MANOEUVRES_FAULTS: FaultSectionDef = {
  key: "manoeuvres",
  title: "Manoeuvres",
  rows: [
    { id: "control", label: "Control" },
    { id: "observation", label: "Observation" },
  ],
};

/** All fault blocks (for scoring + summary). Order is not visual order. */
export const ALL_FAULT_SECTIONS: FaultSectionDef[] = [
  MANOEUVRES_FAULTS,
  SHOW_ME,
  CONTROLLED_STOP,
  CONTROL,
  MOVE_OFF,
  MIRRORS,
  SIGNALS,
  JUNCTIONS,
  JUDGEMENT,
  POSITIONING_CORE,
  PROGRESS,
  RESPONSE_SIGNS,
];

/**
 * Reference sheet layout — column 1 | column 2 | column 3 (three vertical bands).
 * Eyesight + manoeuvre type checkboxes render above column-1 fault cards in the UI.
 */
export const FAULT_GRID_COLUMNS: [FaultSectionDef[], FaultSectionDef[], FaultSectionDef[]] = [
  [SHOW_ME, CONTROLLED_STOP, CONTROL],
  [MOVE_OFF, MIRRORS, SIGNALS, JUNCTIONS, JUDGEMENT],
  [POSITIONING_CORE, PROGRESS, RESPONSE_SIGNS],
];

const emptyMark = (): FaultMarks => ({ minorCount: 0, serious: false, dangerous: false });

export function emptyFaultMap(rows: FaultRowDef[]): Record<string, FaultMarks> {
  const o: Record<string, FaultMarks> = {};
  for (const r of rows) o[r.id] = emptyMark();
  return o;
}

/** @deprecated use ALL_FAULT_SECTIONS */
export const FAULT_SECTIONS = ALL_FAULT_SECTIONS;
