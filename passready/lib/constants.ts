export const SITE = {
  name: "Prep2Pass",
  tagline: "TestReady Score for learner drivers.",
  locale: "en-GB",
} as const;

/** One-off vs lifetime TestReady Score unlock (Stripe Price IDs map to these in env). */
export const PRICING = {
  single: { display: "£3.99", label: "One-off report", hint: "Single Premium report for this assessment" },
  lifetime: {
    display: "£9.99",
    label: "Lifetime unlimited",
    hint: "Unlimited Premium reports — track progress over time",
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
