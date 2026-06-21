import "server-only";

import { renderPassPilotEmailLayout, stripHtmlToText } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/resend";

type Args = {
  toEmail: string;
  accessUrl: string;
};

export async function sendReportAccessEmail({ toEmail, accessUrl }: Args): Promise<void> {
  const bodyHtml = `<p style="margin:0 0 12px 0;">Click the button below to securely view your report. This link is private and will expire shortly.</p>
    <p style="margin:0;">If you didn&apos;t request this, you can safely ignore this email.</p>`;

  const html = renderPassPilotEmailLayout({
    preheader: "View your Test Ready Score report",
    heading: "Access your Test Ready Score",
    bodyHtml,
    cta: { label: "View My Report", href: accessUrl },
    fallbackUrl: accessUrl,
  });

  const text = stripHtmlToText(`Access your report: ${accessUrl}`);

  await sendEmail({
    to: toEmail,
    subject: "Your Pass Pilot report access link",
    html,
    text,
  });
}
