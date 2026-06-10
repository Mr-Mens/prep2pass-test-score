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

/** Calm membership copy inside authenticated flows when entitlement is lifetime (avoid prospect/pricing framing). */
export const LIFETIME_MEMBER_UI = {
  badge: "Lifetime access active",
  unlimited: "Unlimited reports unlocked",
  journey: "Your driving journey",
  reportsHistory: "Report history",
  journeyInsights: "Journey insights",
  progressRhythm:
    "Each saved report adds to your history. Look back to see how your score and weak areas change over time.",
} as const;

/** One-off vs lifetime TestReady Score unlock (Stripe Price IDs map to these in env). */
export const PRICING = {
  single: { display: "£3.99", label: "One-off report", hint: "Single Premium report for this assessment" },
  lifetime: {
    display: "£9.99",
    label: "Lifetime unlimited",
    hint: "Unlimited Premium reports. Track progress over time.",
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
