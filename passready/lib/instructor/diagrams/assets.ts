/** Slugs for diagram images under /public/diagrams/{slug}.webp (run scripts/optimize-diagram-images.mjs after adding sources). */
export const DIAGRAM_IMAGE_SLUGS = [
  "left-emerge",
  "right-emerge",
  "left-turn",
  "right-turn",
  "crossroad",
  "crossroads-scenarios",
  "staggered-junction",
  "staggered-junction-1",
  "meeting-traffic",
  "roundabout",
  "independent-driving-signs-1",
  "independent-driving-signs-2",
  "independent-driving-signs-3",
  "independent-driving-signs-4",
] as const;

export type DiagramImageSlug = (typeof DIAGRAM_IMAGE_SLUGS)[number];

/** Original uploads kept for re-optimisation; the app serves WebP assets only. */
export const DIAGRAM_SOURCE_FILES: Record<DiagramImageSlug, string> = {
  "left-emerge": "left emerge.PNG",
  "right-emerge": "right emerge.PNG",
  "left-turn": "left turn.PNG",
  "right-turn": "right turn.PNG",
  crossroad: "crossroad.PNG",
  "crossroads-scenarios": "crossroads scenarios.PNG",
  "staggered-junction": "staggared junction.PNG",
  "staggered-junction-1": "staggared junction 1.JPG",
  "meeting-traffic": "meeting traffic.PNG",
  roundabout: "roundabout.jpg",
  "independent-driving-signs-1": "independent driving signs 1.JPG",
  "independent-driving-signs-2": "independent driving signs 2.JPG",
  "independent-driving-signs-3": "independent driving signs 3.PNG",
  "independent-driving-signs-4": "independent driving signs 4.JPG",
};
