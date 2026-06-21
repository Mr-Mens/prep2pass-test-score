/** Information architecture for Pass Pilot modules — live routes and planned expansion. */
export type PlatformModuleStatus = "live" | "coming-soon";

export type PlatformModule = {
  id: string;
  label: string;
  description: string;
  status: PlatformModuleStatus;
  href?: string;
  audience?: "learner" | "instructor" | "supervisor" | "all";
};

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "pass-pilot-score",
    label: "Pass Pilot Score",
    description: "Structured assessments, Premium reports and Progress Insights for your Learning Journey.",
    status: "live",
    href: "/assessment",
    audience: "learner",
  },
  {
    id: "coaching-tools",
    label: "Coaching Tools",
    description: "Mock tests, pupil tracking and lesson support for instructors.",
    status: "live",
    href: "/welcome?role=instructor",
    audience: "instructor",
  },
  {
    id: "supervisor-guides",
    label: "Supervisor Coaching Guides",
    description: "Resources to support private practice between lessons.",
    status: "live",
    href: "/welcome?role=parent",
    audience: "supervisor",
  },
  {
    id: "teaching-diagrams",
    label: "Teaching Diagrams",
    description: "Visual road layouts and briefing aids for instructors.",
    status: "live",
    href: "/instructor/diagrams",
    audience: "instructor",
  },
  {
    id: "theory-hub",
    label: "Theory Hub",
    description: "Structured theory revision and hazard perception support.",
    status: "coming-soon",
    audience: "learner",
  },
  {
    id: "driving-routes",
    label: "Driving Routes",
    description: "Curated practice routes for learners and supervisors.",
    status: "coming-soon",
    audience: "all",
  },
  {
    id: "adi-part-3",
    label: "ADI Part 3 Hub",
    description: "Part 3 preparation resources and coaching frameworks.",
    status: "coming-soon",
    audience: "instructor",
  },
  {
    id: "standards-check",
    label: "Standards Check Hub",
    description: "Standards Check preparation and reflective coaching tools.",
    status: "coming-soon",
    audience: "instructor",
  },
];

export const LIVE_PLATFORM_MODULES = PLATFORM_MODULES.filter((m) => m.status === "live");
export const COMING_SOON_PLATFORM_MODULES = PLATFORM_MODULES.filter((m) => m.status === "coming-soon");
