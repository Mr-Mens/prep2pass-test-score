/** Public product roadmap — keep in sync with `PLATFORM_MODULES` where modules overlap. */

export type RoadmapStatus = "shipped" | "in_progress" | "planned" | "exploring";

export type RoadmapAudience = "learner" | "instructor" | "supervisor" | "platform";

export type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  audiences: RoadmapAudience[];
  /** Optional target window, e.g. "Q3 2026". Omitted when already live. */
  timeframe?: string;
};

export const ROADMAP_LAST_UPDATED = "June 2026";

export const ROADMAP_INTRO =
  "Pass Pilot is built in the open with real instructors, learners and supervisors. This page shows what is live today, what we are building now, and what we are exploring next. Priorities can shift as we learn from the people using the platform every day.";

export const ROADMAP_FEEDBACK_EMAIL = "hello@thepasspilot.com";

export const ROADMAP_STATUS_META: Record<
  RoadmapStatus,
  { label: string; summary: string }
> = {
  shipped: {
    label: "Live now",
    summary: "Available in Pass Pilot today.",
  },
  in_progress: {
    label: "In build",
    summary: "Actively being designed and shipped.",
  },
  planned: {
    label: "Up next",
    summary: "Committed direction after current build priorities.",
  },
  exploring: {
    label: "Exploring",
    summary: "Ideas we are validating before we commit.",
  },
};

export const ROADMAP_AUDIENCE_LABELS: Record<RoadmapAudience, string> = {
  learner: "Learners",
  instructor: "Instructors",
  supervisor: "Supervisors",
  platform: "Platform",
};

export const PUBLIC_ROADMAP: RoadmapItem[] = [
  {
    id: "test-ready-score",
    title: "Test Ready Score assessments",
    description:
      "Structured self-assessments with a clear readiness score, risk areas and a personalised action plan.",
    status: "shipped",
    audiences: ["learner"],
  },
  {
    id: "smart-reports",
    title: "Smart Reports and Progress Insights",
    description:
      "Detailed debriefs, score history and trend tracking so learners and instructors can see improvement over time.",
    status: "shipped",
    audiences: ["learner", "instructor", "supervisor"],
  },
  {
    id: "premium-subscription",
    title: "Premium subscription with free trial",
    description:
      "Monthly Premium access with a trial period, Graduate Mode billing stop when you pass, and secure Stripe checkout.",
    status: "shipped",
    audiences: ["learner", "platform"],
  },
  {
    id: "coaching-tools",
    title: "Instructor Coaching Tools",
    description:
      "Mock tests, pupil management, lesson scheduling and structured lesson support in one instructor workspace.",
    status: "shipped",
    audiences: ["instructor"],
  },
  {
    id: "teaching-diagrams",
    title: "Teaching Diagrams",
    description: "Visual road layouts and briefing aids instructors can use in lessons and mock tests.",
    status: "shipped",
    audiences: ["instructor"],
  },
  {
    id: "supervisor-workspace",
    title: "Supervisor workspace",
    description:
      "Link to a learner account, view reports and Progress Insights, and support private practice between lessons.",
    status: "shipped",
    audiences: ["supervisor", "learner"],
  },
  {
    id: "learning-centre",
    title: "Learning Centre",
    description: "Growing library of coaching guides, reflections and resources across the learning journey.",
    status: "shipped",
    audiences: ["learner", "supervisor", "instructor"],
  },
  {
    id: "instructor-referrals",
    title: "Instructor referral programme",
    description:
      "Approved driving instructors can refer learners and track referral commissions inside their workspace.",
    status: "shipped",
    audiences: ["instructor", "platform"],
  },
  {
    id: "theory-hub",
    title: "Theory Hub",
    description:
      "Structured theory revision, topic drills and hazard perception support woven into the Learning Journey.",
    status: "in_progress",
    audiences: ["learner"],
    timeframe: "Q3 2026",
  },
  {
    id: "driving-routes",
    title: "Driving Routes",
    description:
      "Curated practice routes for learners and supervisors, mapped to common test-centre areas and skill themes.",
    status: "in_progress",
    audiences: ["learner", "supervisor"],
    timeframe: "Q3 2026",
  },
  {
    id: "adi-part-3",
    title: "ADI Part 3 Hub",
    description:
      "Part 3 preparation frameworks, reflective coaching prompts and structured revision for trainee instructors.",
    status: "in_progress",
    audiences: ["instructor"],
    timeframe: "Q3 2026",
  },
  {
    id: "standards-check",
    title: "Standards Check Hub",
    description:
      "Standards Check preparation, lesson analysis templates and reflective tools for qualified ADIs.",
    status: "in_progress",
    audiences: ["instructor"],
    timeframe: "Q4 2026",
  },
  {
    id: "extended-promotions",
    title: "Campaign promotions",
    description:
      "Admin-managed discount codes and extended Premium trials for launch partners, schools and instructor-led campaigns.",
    status: "shipped",
    audiences: ["platform", "learner"],
  },
  {
    id: "school-campaigns",
    title: "School and fleet campaigns",
    description:
      "Bulk onboarding, shared progress views and campaign reporting for driving schools and fleet operators.",
    status: "planned",
    audiences: ["instructor", "platform"],
    timeframe: "2026",
  },
  {
    id: "practice-log-mobile",
    title: "Practice log improvements",
    description:
      "Richer supervisor practice logging, lesson notes sync and clearer weekly practice summaries.",
    status: "planned",
    audiences: ["supervisor", "learner"],
    timeframe: "2026",
  },
  {
    id: "test-countdown-plus",
    title: "Test day preparation kit",
    description:
      "Expanded countdown tools, last-minute checklists and calm-day guidance as the practical test approaches.",
    status: "planned",
    audiences: ["learner"],
    timeframe: "2026",
  },
  {
    id: "native-apps",
    title: "Native mobile apps",
    description: "Installable iOS and Android experiences for on-the-go assessments, reports and lesson prep.",
    status: "exploring",
    audiences: ["learner", "instructor", "supervisor"],
  },
  {
    id: "lifetime-premium",
    title: "Lifetime Premium options",
    description: "Long-term access bundles for learners who want open-ended preparation beyond monthly billing.",
    status: "exploring",
    audiences: ["learner", "platform"],
  },
  {
    id: "invite-only-promos",
    title: "Invite-only promotions",
    description:
      "Closed campaigns for partner schools, instructor cohorts and early-access feature groups.",
    status: "exploring",
    audiences: ["platform", "instructor"],
  },
  {
    id: "multi-language",
    title: "Additional languages",
    description:
      "Localised reports and coaching copy for learners whose first language is not English.",
    status: "exploring",
    audiences: ["platform", "learner"],
  },
];

export const ROADMAP_STATUS_ORDER: RoadmapStatus[] = [
  "shipped",
  "in_progress",
  "planned",
  "exploring",
];

export function roadmapItemsForAudience(
  audience: RoadmapAudience | "all",
): RoadmapItem[] {
  if (audience === "all") return PUBLIC_ROADMAP;
  return PUBLIC_ROADMAP.filter((item) => item.audiences.includes(audience));
}

export function roadmapItemsByStatus(
  items: RoadmapItem[],
): Record<RoadmapStatus, RoadmapItem[]> {
  return ROADMAP_STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = items.filter((item) => item.status === status);
      return acc;
    },
    {
      shipped: [],
      in_progress: [],
      planned: [],
      exploring: [],
    } as Record<RoadmapStatus, RoadmapItem[]>,
  );
}
