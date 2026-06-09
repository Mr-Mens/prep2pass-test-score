export type SafetyGuidanceCard = {
  id: string;
  title: string;
  items: readonly string[];
};

export const SUPERVISOR_SAFETY_GUIDANCE: readonly SafetyGuidanceCard[] = [
  {
    id: "before",
    title: "Before driving",
    items: [
      "Check learner-driver insurance covers private practice with you.",
      "Confirm L-plates are fitted correctly and the vehicle is roadworthy.",
      "Agree a calm route and a clear finish time before you set off.",
      "Make sure you both feel rested, not rushed after work or school.",
    ],
  },
  {
    id: "during",
    title: "During driving",
    items: [
      "Keep instructions short, calm, and one step at a time.",
      "Avoid information overload. Pause between guidance.",
      "Watch for fatigue or rising stress; swap roles or stop if needed.",
      "Stay supportive: praise specific good habits, not just outcomes.",
    ],
  },
  {
    id: "after",
    title: "After driving",
    items: [
      "Discuss two strengths before one improvement area.",
      "Agree one priority for the next session, not a long list.",
      "Log the session while details are fresh (duration, road type, confidence).",
      "Encourage your learner to share highlights with their instructor.",
    ],
  },
  {
    id: "stop",
    title: "When to stop practice",
    items: [
      "Fatigue, hunger, or loss of concentration in either of you.",
      "Rising stress, arguments, or panic in the car.",
      "Unsafe weather, visibility, or traffic conditions.",
      "If the session stops feeling constructive, try again another day.",
    ],
  },
] as const;

export const SUPERVISOR_DISCLAIMERS = {
  support:
    "Test Ready Score supports private practice but does not replace professional driving instruction.",
  legal:
    "Supervisors must ensure they meet legal requirements and that appropriate learner-driver insurance is in place.",
} as const;

export const SUPERVISOR_ROAD_TYPES = [
  "Residential",
  "Urban",
  "Rural",
  "Dual carriageway",
  "Mixed routes",
] as const;
