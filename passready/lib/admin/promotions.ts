/** Admin promotion types and shared helpers. */
import { ADMIN_PROMO_DISCOUNT_PERCENTS, formatDiscountLabel, type AdminPromoDiscountPercent } from "@/lib/admin/promo-discounts";

export const ADMIN_PROMOTION_TYPES = ["discount", "trial_extension"] as const;

export type AdminPromotionType = (typeof ADMIN_PROMOTION_TYPES)[number];

export const TRIAL_EXTENSION_PRESETS = [7, 14, 21, 30] as const;

export type TrialExtensionPreset = (typeof TRIAL_EXTENSION_PRESETS)[number];

export { ADMIN_PROMO_DISCOUNT_PERCENTS, formatDiscountLabel, type AdminPromoDiscountPercent };

export function isAdminPromotionType(value: string): value is AdminPromotionType {
  return (ADMIN_PROMOTION_TYPES as readonly string[]).includes(value);
}

export function formatPromotionTypeLabel(type: AdminPromotionType): string {
  return type === "discount" ? "Discount" : "Trial";
}

export function formatTrialDaysLabel(days: number): string {
  return days === 1 ? "1-day trial" : `${days}-day trial`;
}

export function formatPromotionSummary(promo: {
  promotionType: AdminPromotionType;
  discountPercent: number | null;
  trialDays: number | null;
}): string {
  if (promo.promotionType === "trial_extension" && promo.trialDays != null) {
    return formatTrialDaysLabel(promo.trialDays);
  }
  if (promo.discountPercent != null) {
    return formatDiscountLabel(promo.discountPercent);
  }
  return "Promotion";
}

export function isTrialExtensionPreset(value: number): value is TrialExtensionPreset {
  return (TRIAL_EXTENSION_PRESETS as readonly number[]).includes(value);
}
