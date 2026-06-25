export const SITE = {
  name: "Pass Pilot",
  tagline: "Pass Pilot driving education platform.",
  locale: "en-GB",
} as const;

/** App brand (Pass Pilot). Score/report naming uses Test Ready Score. */
export const PRODUCT = {
  name: "Pass Pilot",
  score: "Test Ready Score",
  report: "Test Ready Score Report",
  history: "Test Ready Score History",
  snapshot: "Test Ready Score Snapshot",
  tagline: "Know. Improve. Pass.",
  altTagline:
    "Helping learners, instructors and supervisors build skills, track progress and prepare confidently for every stage of the driving journey.",
  eyebrow: "Pass Pilot",
} as const;

/** Pass Pilot logo and icon assets (`/public/brand/`). */
export const BRAND_LOGO = {
  src: "/brand/pass-pilot-logo.png",
  width: 677,
  height: 589,
} as const;

export const BRAND_ICONS = {
  favicon32: "/brand/pass-pilot-favicon-32.png",
  icon192: "/brand/pass-pilot-icon-192.png",
  icon512: "/brand/pass-pilot-icon-512.png",
  apple180: "/brand/pass-pilot-icon-180.png",
} as const;

/** Open Graph / Twitter / link-preview image (`public/social-banner/`). */
export const SOCIAL_BANNER = {
  src: "/social-banner/og.png",
  width: 1200,
  height: 630,
  alt: "Pass Pilot, helping learners, instructors and parents/supervisors",
} as const;

export const SITE_DEFAULT_DESCRIPTION = PRODUCT.altTagline;

/** Short copy for Open Graph / Twitter / link previews (~1–1.5 lines). */
export const SITE_SOCIAL_DESCRIPTION =
  "Helping learners, instructors and parents/supervisors." as const;

/** Link-preview title — shortest brand form. */
export const SITE_META_TITLE = `${PRODUCT.name} | ${PRODUCT.tagline}` as const;

/** Branded call-to-action copy, prefer these over generic “assessment” wording. */
export const BRAND_CTA = {
  getMyScore: "Get My Test Ready Score",
  getYourScore: "Get Your Test Ready Score",
  updateMyScore: "Update My Test Ready Score",
  getUpdatedScore: "Get an Updated Score",
  getAnotherScore: "Get Another Test Ready Score",
  viewScoreHistory: "View My Test Ready Score History",
  viewMyScore: "View My Test Ready Score",
  viewSampleReport: "View Sample Report",
  invitePupil: "Invite Pupil to Get Their Test Ready Score",
  sendScoreInvite: "Pass Pilot invite",
  helpLearnerGetScore: "Help Your Learner Get Their Test Ready Score",
  takesFiveMinutes: "Takes around 5 minutes",
  entrySubtext:
    "Answer a few questions and receive your Pass Pilot Score, Progress Insights and a personalised action plan.",
} as const;

/** Proprietary Smart intelligence branding for learner-facing copy (not generic "AI"). */
export const SMART_UI = {
  report: "Smart Report",
  reports: "Smart Reports",
  debrief: "Smart Debrief",
  debriefs: "Smart Debriefs",
  insights: "Smart Insights",
  recommendations: "Smart Recommendations",
  personalisedReports: "Personalised Smart Reports",
  personalisedDebriefs: "Personalised Smart Debriefs",
  marketingLine:
    "Personalised Smart Reports and Debriefs based on your driving progress and learning journey.",
  latestReport: "Latest Smart Report",
  latestDebrief: "Latest Smart Debrief",
} as const;

/** Calm membership copy inside authenticated flows when entitlement is active. */
export const PREMIUM_MEMBER_UI = {
  badge: "Subscription active",
  unlimited: "Full platform access unlocked",
  journey: "Your Learning Journey",
  reportsHistory: "View My Test Ready Score History",
  progressInsights: "Progress Insights",
  journeyInsights: "Progress Insights",
  progressRhythm:
    "Each saved report adds to your Learning Journey. Look back to see how your skills and focus areas develop over time.",
  graduateBadge: "Graduate, congratulations!",
  graduateNote: "Your account and reports stay available. New Test Ready Scores are disabled after you pass.",
} as const;

/** @deprecated use PREMIUM_MEMBER_UI */
export const LIFETIME_MEMBER_UI = PREMIUM_MEMBER_UI;

/** Learner subscription pricing (Stripe Price ID maps in env). */
export const PRICING = {
  subscription: {
    display: "£6.99",
    label: "Monthly subscription",
    hint: `Full platform access: Test Ready Score, ${SMART_UI.insights}, ${SMART_UI.reports}, and Learning Journey tracking.`,
    interval: "month" as const,
    trialDays: 7,
    trialCta: "Start 7-Day Free Trial",
    trialMessage: "Start your 7-day Premium trial to unlock everything.",
  },
  /** Legacy one-off tiers, retained for historical payment metadata only. */
  single: { display: "£3.99", label: "One-off report", hint: "Legacy single report purchase" },
  lifetime: {
    display: "£9.99",
    label: "Lifetime unlimited",
    hint: "Legacy lifetime access (grandfathered accounts)",
  },
} as const;

/** Grouped copy for subscribe / trial upsell (learner Premium). */
export const PREMIUM_SUBSCRIPTION_BENEFIT_GROUPS = [
  {
    title: "Score & Smart Reports",
    items: [
      `Unlimited ${PRODUCT.score} assessments`,
      `${SMART_UI.personalisedReports} with coach notes and syllabus context`,
      `${SMART_UI.debriefs}, test risks, and ${SMART_UI.recommendations.toLowerCase()}`,
      `${SMART_UI.insights} and ${PREMIUM_MEMBER_UI.journey} timeline`,
    ],
  },
  {
    title: "Lessons & mock tests",
    items: [
      "Lesson history with your instructor",
      "Lesson reflections after each session",
      "Mock test reports delivered to your account",
    ],
  },
  {
    title: "Parent & supervisor support",
    items: [
      "Parent and supervisor connections",
      "Shared reports and progress for practice between lessons",
    ],
  },
  {
    title: "Your workspace",
    items: [
      "Full learner dashboard and resources",
      "Instructor link, notifications, and progress tracking",
    ],
  },
] as const;

/** @deprecated use PRICING.single.display */
export const PREMIUM_PRICE = PRICING.single.display;

export { WEAK_AREA_OPTIONS, type WeakAreaId } from "./product-skill-map";

export {
  OFFICIAL_GROUP_ORDER,
  OFFICIAL_SKILL_GROUPS,
  OFFICIAL_SKILLS,
  labelForOfficialGroup,
  officialSkillById,
  type OfficialGroupKey,
  type OfficialSkill,
  type OfficialSkillId,
} from "./dvsa-ready-to-pass-framework";
