import "server-only";

import { getAppUrlForEmail } from "@/lib/email/app-url";
import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

export async function sendGraduateConfirmationEmail(input: {
  toEmail: string;
  firstName?: string | null;
  passDate: string;
}): Promise<void> {
  const appUrl = getAppUrlForEmail();
  const dashboardUrl = `${appUrl}/dashboard`;
  const greeting = input.firstName?.trim() ? `Congratulations, ${input.firstName.trim()}!` : "Congratulations!";

  const bodyHtml = `<p style="margin:0 0 12px 0;">${escape(greeting)}</p>
    <p style="margin:0 0 12px 0;">We recorded your pass on <strong>${escape(input.passDate)}</strong> in Graduate Mode.</p>
    <p style="margin:0;">Your subscription has been cancelled and your reports stay available on Pass Pilot. New assessments are disabled — enjoy the road!</p>`;

  const html = renderPassPilotEmailLayout({
    preheader: "Congratulations on passing your driving test",
    heading: "Pass recorded — congratulations!",
    bodyHtml,
    cta: { label: "View your reports", href: dashboardUrl },
    fallbackUrl: dashboardUrl,
  });

  const text = stripHtmlToText(
    `${greeting}\n\nPass recorded on ${input.passDate}. Your subscription has been cancelled.\n\nView reports: ${dashboardUrl}`,
  );

  await sendEmail({
    to: input.toEmail,
    subject: "Congratulations — your pass is recorded on Pass Pilot",
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
