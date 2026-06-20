import "server-only";

import { randomBytes } from "crypto";

import type { AdminPromoDiscountPercent } from "@/lib/admin/promo-discounts";
import { isMissingCommercialTableError, isSupabaseNetworkError } from "@/lib/server/commercial-schema";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type AdminPromoCodeRow = {
  id: string;
  code: string;
  label: string | null;
  discount_percent: AdminPromoDiscountPercent;
  stripe_coupon_id: string;
  stripe_promotion_code_id: string;
  active: boolean;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
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

export async function insertAdminPromoCode(input: {
  code: string;
  label?: string | null;
  discountPercent: AdminPromoDiscountPercent;
  stripeCouponId: string;
  stripePromotionCodeId: string;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}): Promise<AdminPromoCodeRow> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_promo_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      label: input.label?.trim() || null,
      discount_percent: input.discountPercent,
      stripe_coupon_id: input.stripeCouponId,
      stripe_promotion_code_id: input.stripePromotionCodeId,
      max_redemptions: input.maxRedemptions ?? null,
      expires_at: input.expiresAt?.toISOString() ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("unique")) throw new Error("Promo code already exists");
    throwForPromoDbError(error, "create promo code");
  }
  return data as AdminPromoCodeRow;
}

export async function listAdminPromoCodes(): Promise<AdminPromoCodeRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_promo_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const kind = classifyPromoDbError(error);
    if (kind === "missing_table") return [];
    throwForPromoDbError(error, "list promo codes");
  }
  return (data ?? []) as AdminPromoCodeRow[];
}

export async function getAdminPromoCodeById(id: string): Promise<AdminPromoCodeRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("admin_promo_codes").select("*").eq("id", id).maybeSingle();
  if (error) {
    const kind = classifyPromoDbError(error);
    if (kind === "missing_table") return null;
    throwForPromoDbError(error, "read promo code");
  }
  return data as AdminPromoCodeRow | null;
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
  return data as AdminPromoCodeRow | null;
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
  return data as AdminPromoCodeRow | null;
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

export function isPromoCodeUsable(row: AdminPromoCodeRow, now = new Date()): boolean {
  if (!row.active) return false;
  if (row.expires_at && new Date(row.expires_at) < now) return false;
  if (row.max_redemptions != null && row.times_redeemed >= row.max_redemptions) return false;
  return true;
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
