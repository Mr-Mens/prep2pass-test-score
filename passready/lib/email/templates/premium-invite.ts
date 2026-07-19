import "server-only";

import { formatDiscountLabel } from "@/lib/admin/promo-discounts";
import { getAppUrlForEmail } from "@/lib/email/app-url";
import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPremiumInviteUrl(token: string): string {
  return `${getAppUrlForEmail()}/invite/premium/${encodeURIComponent(token)}`;
}

export async function sendPremiumInviteEmail(input: {
  toEmail: string;
  inviteToken: string;
  discountPercent: number;
  expiresAt: Date | string;
}): Promise<void> {
  const inviteUrl = buildPremiumInviteUrl(input.inviteToken);
  const isFullGift = input.discountPercent >= 100;
  const discountLabel = formatDiscountLabel(input.discountPercent);
  const expiresLabel = new Date(input.expiresAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const heading = isFullGift ? "Your free Pass Pilot Premium invite" : "Your Pass Pilot Premium invite";
  const bodyHtml = isFullGift
    ? `<p style="margin:0 0 12px 0;">You've been invited to <strong>Pass Pilot Premium at no cost</strong>.</p>
       <p style="margin:0 0 12px 0;">Open the link below, create your account with this email address, verify once, and Premium unlocks automatically — no payment step.</p>
       <p style="margin:0;">This invite is valid until <strong>${escape(expiresLabel)}</strong>.</p>`
    : `<p style="margin:0 0 12px 0;">You've been invited to Pass Pilot Premium with <strong>${escape(discountLabel)}</strong>.</p>
       <p style="margin:0 0 12px 0;">Open the link below, create your account with this email address, then claim your discount in one short step.</p>
       <p style="margin:0;">This invite is valid until <strong>${escape(expiresLabel)}</strong>.</p>`;

  const html = renderPassPilotEmailLayout({
    preheader: isFullGift
      ? "Activate your free Pass Pilot Premium access"
      : `Claim ${discountLabel} Pass Pilot Premium`,
    heading,
    bodyHtml,
    cta: { label: isFullGift ? "Activate Premium" : "Claim Premium invite", href: inviteUrl },
    fallbackUrl: inviteUrl,
  });

  const text = stripHtmlToText(
    isFullGift
      ? `You've been invited to Pass Pilot Premium at no cost.\n\nActivate: ${inviteUrl}\n\nValid until ${expiresLabel}.`
      : `You've been invited to Pass Pilot Premium with ${discountLabel}.\n\nClaim invite: ${inviteUrl}\n\nValid until ${expiresLabel}.`,
  );

  await sendEmail({
    to: input.toEmail,
    subject: isFullGift ? "Your free Pass Pilot Premium invite" : `Your Pass Pilot Premium invite (${discountLabel})`,
    html,
    text,
  });
}
