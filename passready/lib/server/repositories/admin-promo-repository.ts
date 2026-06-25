import "server-only";

import { randomBytes } from "crypto";

import type { AdminPromoDiscountPercent } from "@/lib/admin/promo-discounts";
import type { AdminPromotionType } from "@/lib/admin/promotions";
import { isMissingCommercialTableError, isSupabaseNetworkError } from "@/lib/server/commercial-schema";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type AdminPromoCodeRow = {
  id: string;
  code: string;
  label: string | null;
  promotion_type: AdminPromotionType;
  discount_percent: AdminPromoDiscountPercent | null;
  trial_days: number | null;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
  campaign_name: string | null;
  notes: string | null;
  active: boolean;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminPromotionAnalytics = {
  timesRedeemed: number;
  activeUsers: number;
  trialConversions: number;
  discountConversions: number;
};

export type AdminPremiumInviteRow = {
  id: string;
  token: string;
  pupil_email: string;
  promo_code_id: string | null;
  discount_percent: AdminPromoDiscountPercent;
  status: "pending" | "redeemed" | "expired" | "revoked";
  expires_at: string;
  redeemed_at: string | null;
  redeemed_by_user_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminPremiumInviteWithPromo = AdminPremiumInviteRow & {
  promo_code: string | null;
};

function classifyPromoDbError(error: { code?: string; message?: string } | null): "missing_table" | "network" | "other" {
  if (!error) return "other";
  if (isMissingCommercialTableError(error)) return "missing_table";
  const msg = (error.message ?? "").toLowerCase();
  if (
    msg.includes("admin_promo_codes") ||
    msg.includes("admin_premium_invites") ||
    msg.includes("admin_promotion_redemptions") ||
    msg.includes("could not find") ||
    msg.includes("schema cache")
  ) {
    if (msg.includes("does not exist") || msg.includes("could not find") || msg.includes("schema cache")) {
      return "missing_table";
    }
  }
  if (isSupabaseNetworkError(error)) return "network";
  return "other";
}

function throwForPromoDbError(error: { code?: string; message?: string }, action: string): never {
  const kind = classifyPromoDbError(error);
  if (kind === "missing_table") throw new Error("PROMO_MIGRATION_REQUIRED");
  if (kind === "network") throw new Error("SUPABASE_UNREACHABLE");
  console.error(`[admin-promo] ${action} failed`, error.message);
  throw new Error(`Failed to ${action}`);
}

function normalizePromotionRow(row: Record<string, unknown>): AdminPromoCodeRow {
  const promotionType = (row.promotion_type as AdminPromotionType | null) ?? "discount";
  return {
    ...(row as AdminPromoCodeRow),
    promotion_type: promotionType,
    discount_percent: (row.discount_percent as AdminPromoDiscountPercent | null) ?? null,
    trial_days: (row.trial_days as number | null) ?? null,
    stripe_coupon_id: (row.stripe_coupon_id as string | null) ?? null,
    stripe_promotion_code_id: (row.stripe_promotion_code_id as string | null) ?? null,
    campaign_name: (row.campaign_name as string | null) ?? (row.label as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  };
}

async function loadPromoCodeMap(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("admin_promo_codes").select("id, code").in("id", ids);
  if (error) throwForPromoDbError(error, "load promo codes");
  for (const row of data ?? []) map.set(row.id, row.code);
  return map;
}

export function generatePremiumInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export function generateAutoPromoCode(discountPercent: AdminPromoDiscountPercent, prefix = "PILOT"): string {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${discountPercent}-${suffix}`;
}

export function generateAutoTrialPromoCode(trialDays: number, prefix = "TRIAL"): string {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${trialDays}-${suffix}`;
}

export async function insertAdminDiscountPromotion(input: {
  code: string;
  campaignName?: string | null;
  notes?: string | null;
  label?: string | null;
  discountPercent: AdminPromoDiscountPercent;
  stripeCouponId: string;
  stripePromotionCodeId: string;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}): Promise<AdminPromoCodeRow> {
  const supabase = getSupabaseServerClient();
  const campaignName = input.campaignName?.trim() || input.label?.trim() || null;
  const { data, error } = await supabase
    .from("admin_promo_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      label: campaignName,
      campaign_name: campaignName,
      notes: input.notes?.trim() || null,
      promotion_type: "discount",
      discount_percent: input.discountPercent,
      trial_days: null,
      stripe_coupon_id: input.stripeCouponId,
      stripe_promotion_code_id: input.stripePromotionCodeId,
      max_redemptions: input.maxRedemptions ?? null,
      expires_at: input.expiresAt?.toISOString() ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("unique")) throw new Error("Promo code already exists");
    throwForPromoDbError(error, "create discount promotion");
  }
  return normalizePromotionRow(data as Record<string, unknown>);
}

export async function insertAdminTrialPromotion(input: {
  code: string;
  trialDays: number;
  campaignName?: string | null;
  notes?: string | null;
  label?: string | null;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}): Promise<AdminPromoCodeRow> {
  const supabase = getSupabaseServerClient();
  const campaignName = input.campaignName?.trim() || input.label?.trim() || null;
  const { data, error } = await supabase
    .from("admin_promo_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      label: campaignName,
      campaign_name: campaignName,
      notes: input.notes?.trim() || null,
      promotion_type: "trial_extension",
      discount_percent: null,
      trial_days: input.trialDays,
      stripe_coupon_id: null,
      stripe_promotion_code_id: null,
      max_redemptions: input.maxRedemptions ?? null,
      expires_at: input.expiresAt?.toISOString() ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("unique")) throw new Error("Promo code already exists");
    throwForPromoDbError(error, "create trial promotion");
  }
  return normalizePromotionRow(data as Record<string, unknown>);
}

/** @deprecated Use insertAdminDiscountPromotion */
export async function insertAdminPromoCode(input: {
  code: string;
  label?: string | null;
  discountPercent: AdminPromoDiscountPercent;
  stripeCouponId: string;
  stripePromotionCodeId: string;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}): Promise<AdminPromoCodeRow> {
  return insertAdminDiscountPromotion({
    code: input.code,
    label: input.label,
    discountPercent: input.discountPercent,
    stripeCouponId: input.stripeCouponId,
    stripePromotionCodeId: input.stripePromotionCodeId,
    maxRedemptions: input.maxRedemptions,
    expiresAt: input.expiresAt,
  });
}

export async function listAdminPromoCodes(promotionType?: AdminPromotionType): Promise<AdminPromoCodeRow[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase.from("admin_promo_codes").select("*").order("created_at", { ascending: false }).limit(200);
  if (promotionType) {
    query = query.eq("promotion_type", promotionType);
  }
  const { data, error } = await query;

  if (error) {
    const kind = classifyPromoDbError(error);
    if (kind === "missing_table") return [];
    throwForPromoDbError(error, "list promo codes");
  }
  return (data ?? []).map((row) => normalizePromotionRow(row as Record<string, unknown>));
}

export async function getAdminPromoCodeById(id: string): Promise<AdminPromoCodeRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("admin_promo_codes").select("*").eq("id", id).maybeSingle();
  if (error) {
    const kind = classifyPromoDbError(error);
    if (kind === "missing_table") return null;
    throwForPromoDbError(error, "read promo code");
  }
  return data ? normalizePromotionRow(data as Record<string, unknown>) : null;
}

export async function getAdminPromoCodeByCode(code: string): Promise<AdminPromoCodeRow | null> {
  const supabase = getSupabaseServerClient();
  const normalized = code.trim().toUpperCase();
  const { data, error } = await supabase.from("admin_promo_codes").select("*").eq("code", normalized).maybeSingle();
  if (error) {
    const kind = classifyPromoDbError(error);
    if (kind === "missing_table") return null;
    throwForPromoDbError(error, "read promo code");
  }
  return data ? normalizePromotionRow(data as Record<string, unknown>) : null;
}

export async function deactivateAdminPromoCode(id: string): Promise<AdminPromoCodeRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_promo_codes")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throwForPromoDbError(error, "deactivate promo code");
  return data ? normalizePromotionRow(data as Record<string, unknown>) : null;
}

export async function incrementAdminPromoRedemption(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const row = await getAdminPromoCodeById(id);
  if (!row) return;

  const { error } = await supabase
    .from("admin_promo_codes")
    .update({
      times_redeemed: row.times_redeemed + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) console.error("[admin-promo] incrementAdminPromoRedemption failed", error.message);
}

export async function recordPromotionRedemption(input: {
  promoCodeId: string;
  userId: string;
  promotionType: AdminPromotionType;
  stripeSubscriptionId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { error: redemptionError } = await supabase.from("admin_promotion_redemptions").upsert(
    {
      promo_code_id: input.promoCodeId,
      user_id: input.userId,
      promotion_type: input.promotionType,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      redeemed_at: now,
      updated_at: now,
    },
    { onConflict: "promo_code_id,user_id" },
  );

  if (redemptionError) {
    console.error("[admin-promo] recordPromotionRedemption failed", redemptionError.message);
  }

  await incrementAdminPromoRedemption(input.promoCodeId);

  if (input.stripeSubscriptionId) {
    const { error: subError } = await supabase
      .from("user_subscriptions")
      .update({
        admin_promo_code_id: input.promoCodeId,
        updated_at: now,
      })
      .eq("user_id", input.userId);
    if (subError) {
      console.error("[admin-promo] link subscription promo failed", subError.message);
    }
  }
}

export async function markPromotionConverted(input: {
  userId: string;
  stripeSubscriptionId: string;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("admin_promotion_redemptions")
    .update({
      converted_to_paid_at: now,
      stripe_subscription_id: input.stripeSubscriptionId,
      updated_at: now,
    })
    .eq("user_id", input.userId)
    .eq("stripe_subscription_id", input.stripeSubscriptionId)
    .is("converted_to_paid_at", null);

  if (error) {
    console.error("[admin-promo] markPromotionConverted failed", error.message);
  }
}

export async function getPromotionAnalytics(promoCodeId: string): Promise<AdminPromotionAnalytics> {
  const supabase = getSupabaseServerClient();
  const promo = await getAdminPromoCodeById(promoCodeId);
  if (!promo) {
    return { timesRedeemed: 0, activeUsers: 0, trialConversions: 0, discountConversions: 0 };
  }

  const { data: redemptions, error: redemptionError } = await supabase
    .from("admin_promotion_redemptions")
    .select("user_id, converted_to_paid_at")
    .eq("promo_code_id", promoCodeId);

  if (redemptionError) {
    if (classifyPromoDbError(redemptionError) === "missing_table") {
      return {
        timesRedeemed: promo.times_redeemed,
        activeUsers: 0,
        trialConversions: 0,
        discountConversions: 0,
      };
    }
    throwForPromoDbError(redemptionError, "load promotion analytics");
  }

  const userIds = (redemptions ?? []).map((row) => row.user_id as string);
  let activeUsers = 0;
  if (userIds.length > 0) {
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("user_id, status")
      .eq("admin_promo_code_id", promoCodeId)
      .in("status", ["trialing", "active", "past_due"]);
    activeUsers = subs?.length ?? 0;
  }

  const trialConversions =
    promo.promotion_type === "trial_extension"
      ? (redemptions ?? []).filter((row) => row.converted_to_paid_at).length
      : 0;

  const discountConversions =
    promo.promotion_type === "discount"
      ? (redemptions ?? []).filter((row) => row.converted_to_paid_at).length
      : 0;

  return {
    timesRedeemed: promo.times_redeemed,
    activeUsers,
    trialConversions,
    discountConversions,
  };
}

export function isPromoCodeUsable(row: AdminPromoCodeRow, now = new Date()): boolean {
  if (!row.active) return false;
  if (row.expires_at && new Date(row.expires_at) < now) return false;
  if (row.max_redemptions != null && row.times_redeemed >= row.max_redemptions) return false;
  return true;
}

export function isDiscountPromotion(row: AdminPromoCodeRow): boolean {
  return row.promotion_type === "discount" && row.discount_percent != null && row.stripe_promotion_code_id != null;
}

export function isTrialExtensionPromotion(row: AdminPromoCodeRow): boolean {
  return row.promotion_type === "trial_extension" && row.trial_days != null && row.trial_days > 0;
}

export async function insertAdminPremiumInvite(input: {
  token: string;
  pupilEmail: string;
  promoCodeId: string | null;
  discountPercent: AdminPromoDiscountPercent;
  expiresAt: Date;
  note?: string | null;
}): Promise<AdminPremiumInviteRow> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_premium_invites")
    .insert({
      token: input.token,
      pupil_email: input.pupilEmail.trim().toLowerCase(),
      promo_code_id: input.promoCodeId,
      discount_percent: input.discountPercent,
      expires_at: input.expiresAt.toISOString(),
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throwForPromoDbError(error, "create premium invite");
  return data as AdminPremiumInviteRow;
}

export async function listAdminPremiumInvites(): Promise<AdminPremiumInviteWithPromo[]> {
  const supabase = getSupabaseServerClient();
  const { data: invites, error } = await supabase
    .from("admin_premium_invites")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const kind = classifyPromoDbError(error);
    if (kind === "missing_table") return [];
    throwForPromoDbError(error, "list premium invites");
  }

  const rows = (invites ?? []) as AdminPremiumInviteRow[];
  const promoIds = Array.from(new Set(rows.map((row) => row.promo_code_id).filter((id): id is string => Boolean(id))));
  const promoMap = await loadPromoCodeMap(promoIds);

  return rows.map((invite) => ({
    ...invite,
    promo_code: invite.promo_code_id ? (promoMap.get(invite.promo_code_id) ?? null) : null,
  }));
}

export async function getAdminPremiumInviteByToken(token: string): Promise<AdminPremiumInviteWithPromo | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("admin_premium_invites").select("*").eq("token", token).maybeSingle();

  if (error) {
    const kind = classifyPromoDbError(error);
    if (kind === "missing_table") return null;
    throwForPromoDbError(error, "read premium invite");
  }
  if (!data) return null;

  const invite = data as AdminPremiumInviteRow;
  let promoCode: string | null = null;
  if (invite.promo_code_id) {
    const promoMap = await loadPromoCodeMap([invite.promo_code_id]);
    promoCode = promoMap.get(invite.promo_code_id) ?? null;
  }

  return {
    ...invite,
    promo_code: promoCode,
  };
}

export async function markAdminPremiumInviteRedeemed(inviteId: string, userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("admin_premium_invites")
    .update({
      status: "redeemed",
      redeemed_at: now,
      redeemed_by_user_id: userId,
      updated_at: now,
    })
    .eq("id", inviteId)
    .eq("status", "pending");

  if (error) console.error("[admin-promo] markAdminPremiumInviteRedeemed failed", error.message);
}

export function resolvePremiumInviteStatus(
  invite: AdminPremiumInviteRow,
  now = new Date(),
): "pending" | "redeemed" | "expired" | "revoked" {
  if (invite.status === "revoked" || invite.status === "redeemed") return invite.status;
  if (new Date(invite.expires_at) < now) return "expired";
  return invite.status;
}
