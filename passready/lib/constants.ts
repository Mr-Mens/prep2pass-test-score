export const SITE = {
  name: "Prep2Pass",
  tagline: "TestReady Score for learner drivers.",
  locale: "en-GB",
} as const;

export const PREMIUM_PRICE = "£4.99";

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
