import "server-only";

import { getAppUrlForEmail } from "@/lib/email/app-url";
import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

export function buildPupilInviteAcceptUrl(
  inviteToken: string,
  hasExistingAccount: boolean,
  referralId?: string | null,
): string {
  const appUrl = getAppUrlForEmail();
  if (hasExistingAccount) {
    return `${appUrl}/login?next=${encodeURIComponent("/dashboard")}`;
  }
  const q = new URLSearchParams({ invite: inviteToken, next: "/dashboard" });
  if (referralId?.trim()) q.set("referral", referralId.trim());
  return `${appUrl}/signup?${q.toString()}`;
}

export async function sendInstructorPupilInviteEmail(input: {
  toEmail: string;
  pupilName: string;
  instructorName: string;
  inviteToken: string;
  referralId?: string | null;
  hasExistingAccount: boolean;
}): Promise<void> {
  const acceptUrl = buildPupilInviteAcceptUrl(input.inviteToken, input.hasExistingAccount, input.referralId);
  const instructorName = input.instructorName.trim() || "Your instructor";

  const bodyHtml = input.hasExistingAccount
    ? `<p style="margin:0 0 12px 0;">${escape(instructorName)} has invited you to connect on Pass Pilot as their pupil, <strong>${escape(input.pupilName)}</strong>.</p>
       <p style="margin:0;">Sign in to accept the invitation from your dashboard notifications.</p>`
    : `<p style="margin:0 0 12px 0;">${escape(instructorName)} has invited you to connect on Pass Pilot as their pupil, <strong>${escape(input.pupilName)}</strong>.</p>
       <p style="margin:0;">Create your free learner account to accept the invitation and share your progress with your instructor.</p>`;

  const html = renderPassPilotEmailLayout({
    preheader: `${instructorName} invited you to Pass Pilot`,
    heading: "Your instructor invited you to Pass Pilot",
    bodyHtml,
    cta: { label: "Accept Invitation", href: acceptUrl },
    fallbackUrl: acceptUrl,
  });

  const text = stripHtmlToText(
    `${instructorName} has invited you to connect on Pass Pilot.\n\nAccept Invitation: ${acceptUrl}`,
  );

  await sendEmail({
    to: input.toEmail,
    subject: "Your instructor invited you to Pass Pilot",
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
