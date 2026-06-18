/** Allowed subscription discount percentages for admin promo codes. */
export const ADMIN_PROMO_DISCOUNT_PERCENTS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export type AdminPromoDiscountPercent = (typeof ADMIN_PROMO_DISCOUNT_PERCENTS)[number];

export function isAdminPromoDiscountPercent(value: number): value is AdminPromoDiscountPercent {
  return (ADMIN_PROMO_DISCOUNT_PERCENTS as readonly number[]).includes(value);
}

export function formatDiscountLabel(percent: number): string {
  return percent >= 100 ? "100% off (free)" : `${percent}% off`;
}
