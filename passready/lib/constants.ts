export const SITE = {
  name: "Prep2Pass",
  tagline: "Test Ready Score for learner drivers.",
  locale: "en-GB",
} as const;

/** Full-wordmark asset (gauge + lettering); served from `/public`. */
export const BRAND_LOGO = {
  src: "/brand/test-ready-score-logo.png",
  width: 1024,
  height: 682,
} as const;

/** Branded call-to-action copy, prefer these over generic “assessment” wording. */
export const BRAND_CTA = {
  getMyScore: "Get My Test Ready Score",
  getYourScore: "Get Your Test Ready Score",
  updateMyScore: "Update My Test Ready Score",
  getUpdatedScore: "Get an Updated Score",
  getAnotherScore: "Get Another Test Ready Score",
  viewScoreHistory: "View My Test Ready Score History",
  viewSampleReport: "View Sample Report",
  invitePupil: "Invite Pupil to Get Their Test Ready Score",
  sendScoreInvite: "Send Test Ready Score Invite",
  helpLearnerGetScore: "Help Your Learner Get Their Test Ready Score",
  takesFiveMinutes: "⏱ Takes around 5 minutes",
  entrySubtext:
    "Answer a few questions and receive your personalised Test Ready Score, risks and action plan.",
} as const;

/** Calm membership copy inside authenticated flows when entitlement is active. */
export const PREMIUM_MEMBER_UI = {
  badge: "Subscription active",
  unlimited: "Unlimited assessments unlocked",
  journey: "Your driving journey",
  reportsHistory: "View My Test Ready Score History",
  journeyInsights: "Journey insights",
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
