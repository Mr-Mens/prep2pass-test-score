export const SITE = {
  name: "Prep2Pass",
  tagline: "Pass Pilot for learner drivers.",
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
  altTagline: "Know where you stand. Know what to improve next.",
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
  alt: "Pass Pilot — UK learner driving assessment",
} as const;

export const SITE_DEFAULT_DESCRIPTION =
  "Pass Pilot helps learner drivers understand their readiness, identify risks and focus lessons on what matters most before test day." as const;

export const SITE_META_TITLE = `${PRODUCT.name} | ${PRODUCT.altTagline}` as const;

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
  sendScoreInvite: "Test Ready Score Invite",
  helpLearnerGetScore: "Help Your Learner Get Their Test Ready Score",
  takesFiveMinutes: "Takes around 5 minutes",
  entrySubtext:
    "Answer a few questions and receive your personalised Test Ready Score, risks and action plan.",
} as const;

/** Calm membership copy inside authenticated flows when entitlement is active. */
export const PREMIUM_MEMBER_UI = {
  badge: "Subscription active",
  unlimited: "Unlimited assessments unlocked",
  journey: "Your driving journey",
  reportsHistory: "View My Test Ready Score History",
  journeyInsights: "Journey Insights",
  progressRhythm:
    "Each saved report adds to your history. Look back to see how your score and weak areas change over time.",
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
    hint: "Unlimited assessments, progress tracking, AI reports, and roadmap access.",
    interval: "month" as const,
  },
  /** Legacy one-off tiers, retained for historical payment metadata only. */
  single: { display: "£3.99", label: "One-off report", hint: "Legacy single report purchase" },
  lifetime: {
    display: "£9.99",
    label: "Lifetime unlimited",
    hint: "Legacy lifetime access (grandfathered accounts)",
  },
} as const;

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
