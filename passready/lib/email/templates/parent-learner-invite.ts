import "server-only";

import { getAppUrlForEmail } from "@/lib/email/app-url";
import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

export function buildParentLearnerInviteUrl(hasExistingAccount: boolean): string {
  const appUrl = getAppUrlForEmail();
  if (hasExistingAccount) {
    return `${appUrl}/login?next=${encodeURIComponent("/dashboard")}`;
  }
  return `${appUrl}/welcome?role=learner`;
}

export async function sendParentLearnerInviteEmail(input: {
  toEmail: string;
  learnerName: string;
  parentName: string;
  hasExistingAccount: boolean;
  alreadyLinked: boolean;
}): Promise<void> {
  const parentName = input.parentName.trim() || "A parent / supervisor";
  const actionUrl = buildParentLearnerInviteUrl(input.hasExistingAccount);

  const bodyHtml = input.alreadyLinked
    ? `<p style="margin:0 0 12px 0;"><strong>${escape(parentName)}</strong> has connected to your Pass Pilot account as a parent / supervisor for <strong>${escape(input.learnerName)}</strong>.</p>
       <p style="margin:0;">They can now view your scores and reports to support you between lessons.</p>`
    : input.hasExistingAccount
      ? `<p style="margin:0 0 12px 0;"><strong>${escape(parentName)}</strong> wants to connect to your Pass Pilot account as a parent / supervisor for <strong>${escape(input.learnerName)}</strong>.</p>
         <p style="margin:0;">Sign in to view your dashboard. Their link will activate once your account matches the email they used.</p>`
      : `<p style="margin:0 0 12px 0;"><strong>${escape(parentName)}</strong> wants to support you on Pass Pilot for <strong>${escape(input.learnerName)}</strong>.</p>
         <p style="margin:0;">Create your learner account with this email address so they can view your progress and reports.</p>`;

  const subject = input.alreadyLinked
    ? "A parent connected to your Pass Pilot account"
    : "A parent wants to connect on Pass Pilot";

  const ctaLabel = input.alreadyLinked ? "Open Pass Pilot" : input.hasExistingAccount ? "Sign in" : "Get started";

  const html = renderPassPilotEmailLayout({
    preheader: subject,
    heading: subject,
    bodyHtml,
    cta: { label: ctaLabel, href: actionUrl },
    fallbackUrl: actionUrl,
  });

  const text = stripHtmlToText(`${subject}\n\n${ctaLabel}: ${actionUrl}`);

  await sendEmail({
    to: input.toEmail,
    subject,
    html,
    text,
  });
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
